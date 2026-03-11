import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { FileSpreadsheet, Download, Save, Trophy, ArrowUpDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { parseMarksheetFile } from "@/lib/marksheet";
import { withTimeout } from "@/lib/async";

type Score = {
  id?: string;
  delegate_user_id: string;
  delegate_name: string;
  committee_name: string;
  diplomacy: number;
  research: number;
  speaking: number;
  total: number;
};

const toCsvCell = (value: string | number) => {
  const serialized = String(value ?? "");
  return /[",\n]/.test(serialized) ? `"${serialized.replace(/"/g, '""')}"` : serialized;
};

const EBMarksheet = () => {
  const { user, roles } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [scores, setScores] = useState<Score[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sortBy, setSortBy] = useState<"total" | "name">("total");
  const isAdmin = roles.has("admin");

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        setLoadingEvents(false);
        return;
      }

      setLoadingEvents(true);
      try {
        if (isAdmin) {
          const { data, error } = await withTimeout(
            supabase.from("events").select("id, title").order("created_at", { ascending: false }),
            15000,
            "Events timed out"
          );
          if (error) throw error;
          setEvents(data || []);
          return;
        }

        const { data: ebAccess, error: ebError } = await withTimeout(
          supabase.from("eb_access").select("event_id").eq("user_id", user.id),
          15000,
          "EB access timed out"
        );
        if (ebError) throw ebError;

        const eventIds = (ebAccess || []).map((entry: any) => entry.event_id);
        if (eventIds.length === 0) {
          setEvents([]);
          return;
        }

        const { data, error } = await withTimeout(
          supabase.from("events").select("id, title").in("id", eventIds).order("created_at", { ascending: false }),
          15000,
          "Events timed out"
        );
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error(error);
        toast.error("Could not load EB events");
      } finally {
        setLoadingEvents(false);
      }
    };

    void fetchEvents();
  }, [isAdmin, user]);

  const fetchScores = async (eventId: string) => {
    setSelectedEvent(eventId);
    if (!eventId) {
      setScores([]);
      return;
    }

    setLoadingScores(true);
    try {
      const { data: regs, error: regsError } = await withTimeout(
        supabase.from("registrations").select("user_id, committee_id").eq("event_id", eventId).eq("status", "approved" as any),
        15000,
        "Registrations timed out"
      );
      if (regsError) throw regsError;
      if (!regs || regs.length === 0) {
        setScores([]);
        return;
      }

      const userIds = regs.map((registration: any) => registration.user_id);
      const committeeIds = regs.map((registration: any) => registration.committee_id).filter(Boolean);

      const [{ data: profiles }, { data: committees }, { data: existingScores }] = await withTimeout(
        Promise.all([
          supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
          committeeIds.length > 0 ? supabase.from("committees").select("id, name").in("id", committeeIds) : Promise.resolve({ data: [] as any[] }),
          (supabase.from("marksheet_scores" as any) as any).select("*").eq("event_id", eventId),
        ]),
        15000,
        "Marksheet data timed out"
      );

      const nameMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile.full_name || "Unknown"]));
      const committeeMap = new Map((committees || []).map((committee: any) => [committee.id, committee.name]));
      const scoreMap = new Map(((existingScores as any[]) || []).map((score: any) => [score.delegate_user_id, score]));

      const merged: Score[] = regs.map((registration: any) => {
        const existing = scoreMap.get(registration.user_id);
        const diplomacy = existing?.diplomacy || 0;
        const research = existing?.research || 0;
        const speaking = existing?.speaking || 0;
        return {
          id: existing?.id,
          delegate_user_id: registration.user_id,
          delegate_name: nameMap.get(registration.user_id) || "Unknown",
          committee_name: committeeMap.get(registration.committee_id) || "General",
          diplomacy,
          research,
          speaking,
          total: diplomacy + research + speaking,
        };
      });

      setScores(merged);
    } catch (error) {
      console.error(error);
      toast.error("Could not load marksheet");
    } finally {
      setLoadingScores(false);
    }
  };

  const updateScore = (index: number, field: "diplomacy" | "research" | "speaking", value: number) => {
    setScores((current) => {
      const updated = [...current];
      updated[index][field] = Math.max(0, Math.min(100, value));
      updated[index].total = updated[index].diplomacy + updated[index].research + updated[index].speaking;
      return updated;
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!selectedEvent) {
      toast.error("Select an event before importing a marksheet");
      return;
    }

    setImporting(true);
    try {
      const rows = await parseMarksheetFile(file);
      if (rows.length === 0) {
        toast.error("No rows found in the uploaded marksheet");
        return;
      }

      const importedByName = new Map(
        rows.map((row) => [`${row.delegate_name.toLowerCase()}::${row.committee_name.toLowerCase()}`, row])
      );
      const importedByDelegate = new Map(rows.map((row) => [row.delegate_name.toLowerCase(), row]));
      let matched = 0;

      setScores((current) =>
        current.map((score) => {
          const exact = importedByName.get(`${score.delegate_name.toLowerCase()}::${score.committee_name.toLowerCase()}`);
          const fallback = importedByDelegate.get(score.delegate_name.toLowerCase());
          const match = exact || fallback;
          if (!match) return score;
          matched += 1;
          return {
            ...score,
            diplomacy: match.diplomacy,
            research: match.research,
            speaking: match.speaking,
            total: match.diplomacy + match.research + match.speaking,
          };
        })
      );

      toast.success(`Imported ${matched} participant scores from ${file.name}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not import marksheet");
    } finally {
      setImporting(false);
    }
  };

  const saveScores = async () => {
    if (!user || !selectedEvent) return;

    setSaving(true);
    try {
      await withTimeout(
        Promise.all(
          scores.map((score) => {
            if (score.id) {
              return (supabase.from("marksheet_scores" as any) as any)
                .update({ diplomacy: score.diplomacy, research: score.research, speaking: score.speaking })
                .eq("id", score.id);
            }
            return (supabase.from("marksheet_scores" as any) as any).insert({
              event_id: selectedEvent,
              delegate_user_id: score.delegate_user_id,
              diplomacy: score.diplomacy,
              research: score.research,
              speaking: score.speaking,
              scored_by: user.id,
            });
          })
        ),
        20000,
        "Saving marks timed out"
      );

      toast.success("Scores saved successfully");
      await fetchScores(selectedEvent);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const sorted = useMemo(
    () => [...scores].sort((a, b) => (sortBy === "total" ? b.total - a.total : a.delegate_name.localeCompare(b.delegate_name))),
    [scores, sortBy]
  );

  const exportCSV = () => {
    if (sorted.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = ["Rank", "Participant Name", "Event", "Judge 1", "Judge 2", "Judge 3", "Total"];
    const rows = sorted.map((score, index) => [index + 1, score.delegate_name, score.committee_name, score.diplomacy, score.research, score.speaking, score.total]);
    const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "marksheet.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Marksheet exported");
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> EB Marksheet
            </h1>
            <p className="text-sm text-muted-foreground">Upload Excel or CSV, score delegates, and export rankings.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label>
              <input type="file" accept=".xlsx,.csv" className="hidden" onChange={(event) => void handleImport(event)} />
              <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" asChild>
                <span><Upload className="h-3.5 w-3.5" /> {importing ? "Importing..." : "Upload Marksheet"}</span>
              </Button>
            </label>
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground h-9 text-xs gap-1.5" onClick={() => void saveScores()} disabled={saving}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <label className="text-xs font-medium text-muted-foreground">Select Event</label>
          {loadingEvents ? (
            <Skeleton className="h-10 w-full rounded-xl mt-2" />
          ) : (
            <select value={selectedEvent} onChange={(event) => void fetchScores(event.target.value)} className="mt-1.5 w-full h-10 rounded-xl bg-secondary border border-border text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Choose event...</option>
              {events.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
            </select>
          )}
        </div>

        {!selectedEvent ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Select an event to upload or edit a marksheet</p>
          </div>
        ) : loadingScores ? (
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No approved delegates in this event</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border bg-secondary/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => setSortBy("name")}>Participant <ArrowUpDown className="h-3 w-3" /></div>
                <div className="col-span-2">Event</div>
                <div className="col-span-2 text-center">Judge 1</div>
                <div className="col-span-2 text-center">Judge 2</div>
                <div className="col-span-1 text-center">Judge 3</div>
                <div className="col-span-1 text-center cursor-pointer hover:text-foreground flex items-center justify-center gap-1" onClick={() => setSortBy("total")}>Total <ArrowUpDown className="h-3 w-3" /></div>
              </div>

              {sorted.map((score, index) => {
                const originalIndex = scores.findIndex((entry) => entry.delegate_user_id === score.delegate_user_id);
                return (
                  <div key={score.delegate_user_id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-border/50 ${index === 0 ? "bg-primary/5" : index === 1 ? "bg-primary/3" : index === 2 ? "bg-primary/[0.02]" : ""}`}>
                    <div className="col-span-1">{index < 3 ? <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary">{index + 1}</span> : <span className="text-xs text-muted-foreground">{index + 1}</span>}</div>
                    <div className="col-span-3"><p className="text-sm font-medium text-foreground truncate">{score.delegate_name}</p></div>
                    <div className="col-span-2"><span className="text-[11px] text-muted-foreground truncate">{score.committee_name}</span></div>
                    <div className="col-span-2"><Input type="number" min={0} max={100} value={score.diplomacy} onChange={(event) => updateScore(originalIndex, "diplomacy", parseInt(event.target.value, 10) || 0)} className="h-8 text-center text-xs bg-secondary border-border rounded-lg" /></div>
                    <div className="col-span-2"><Input type="number" min={0} max={100} value={score.research} onChange={(event) => updateScore(originalIndex, "research", parseInt(event.target.value, 10) || 0)} className="h-8 text-center text-xs bg-secondary border-border rounded-lg" /></div>
                    <div className="col-span-1"><Input type="number" min={0} max={100} value={score.speaking} onChange={(event) => updateScore(originalIndex, "speaking", parseInt(event.target.value, 10) || 0)} className="h-8 text-center text-xs bg-secondary border-border rounded-lg" /></div>
                    <div className="col-span-1 text-center"><span className={`text-sm font-bold ${index === 0 ? "text-primary" : "text-foreground"}`}>{score.total}</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EBMarksheet;
