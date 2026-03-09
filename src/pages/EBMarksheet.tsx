import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { FileSpreadsheet, Download, Save, Trophy, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Score {
  id?: string;
  delegate_user_id: string;
  delegate_name: string;
  committee_name: string;
  diplomacy: number;
  research: number;
  speaking: number;
  total: number;
}

const EBMarksheet = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sortBy, setSortBy] = useState<"total" | "name">("total");

  useEffect(() => {
    const fetchEvents = async () => {
      // EB can see events they have access to
      if (!user) return;
      const { data: ebAccess } = await supabase.from("eb_access").select("event_id").eq("user_id", user.id);
      const eventIds = (ebAccess || []).map((e: any) => e.event_id);
      
      // Also fetch if admin
      const { data: allEvents } = await supabase.from("events").select("id, title").in("id", eventIds.length > 0 ? eventIds : ["00000000-0000-0000-0000-000000000000"]);
      setEvents(allEvents || []);
      setLoading(false);
    };
    fetchEvents();
  }, [user]);

  const fetchScores = async (eventId: string) => {
    setSelectedEvent(eventId);
    if (!eventId) { setScores([]); return; }

    // Get approved delegates for this event
    const { data: regs } = await supabase.from("registrations").select("user_id, committee_id").eq("event_id", eventId).eq("status", "approved" as any);
    if (!regs || regs.length === 0) { setScores([]); return; }

    const userIds = regs.map((r: any) => r.user_id);
    const committeeIds = regs.map((r: any) => r.committee_id).filter(Boolean);

    const [{ data: profiles }, { data: committees }, { data: existingScores }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
      committeeIds.length > 0 ? supabase.from("committees").select("id, name").in("id", committeeIds) : Promise.resolve({ data: [] }),
      (supabase.from("marksheet_scores" as any) as any).select("*").eq("event_id", eventId),
    ]);

    const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name || "Unknown"]));
    const commMap = new Map((committees || []).map((c: any) => [c.id, c.name]));
    const scoreMap = new Map(((existingScores as any[]) || []).map((s: any) => [s.delegate_user_id, s]));

    const merged: Score[] = regs.map((r: any) => {
      const existing = scoreMap.get(r.user_id);
      return {
        id: existing?.id,
        delegate_user_id: r.user_id,
        delegate_name: nameMap.get(r.user_id) || "Unknown",
        committee_name: commMap.get(r.committee_id) || "General",
        diplomacy: existing?.diplomacy || 0,
        research: existing?.research || 0,
        speaking: existing?.speaking || 0,
        total: (existing?.diplomacy || 0) + (existing?.research || 0) + (existing?.speaking || 0),
      };
    });

    setScores(merged);
  };

  const updateScore = (i: number, field: "diplomacy" | "research" | "speaking", value: number) => {
    const updated = [...scores];
    updated[i][field] = Math.max(0, Math.min(100, value));
    updated[i].total = updated[i].diplomacy + updated[i].research + updated[i].speaking;
    setScores(updated);
  };

  const saveScores = async () => {
    if (!user || !selectedEvent) return;
    setSaving(true);
    try {
      for (const s of scores) {
        if (s.id) {
          await (supabase.from("marksheet_scores" as any) as any).update({
            diplomacy: s.diplomacy, research: s.research, speaking: s.speaking,
          }).eq("id", s.id);
        } else {
          await (supabase.from("marksheet_scores" as any) as any).insert({
            event_id: selectedEvent, delegate_user_id: s.delegate_user_id,
            diplomacy: s.diplomacy, research: s.research, speaking: s.speaking, scored_by: user.id,
          });
        }
      }
      toast.success("Scores saved successfully");
      // Refresh to get IDs
      await fetchScores(selectedEvent);
    } catch (err: any) { toast.error(err.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    if (scores.length === 0) { toast.info("No data to export"); return; }
    const sorted = [...scores].sort((a, b) => b.total - a.total);
    const headers = ["Rank", "Delegate", "Committee", "Diplomacy", "Research", "Speaking", "Total"];
    const rows = sorted.map((s, i) => [i + 1, s.delegate_name, s.committee_name, s.diplomacy, s.research, s.speaking, s.total]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "marksheet.csv"; a.click();
    toast.success("Marksheet exported");
  };

  const sorted = [...scores].sort((a, b) => sortBy === "total" ? b.total - a.total : a.delegate_name.localeCompare(b.delegate_name));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" /> EB Marksheet
            </h1>
            <p className="text-sm text-muted-foreground">Score delegates and generate rankings</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground h-9 text-xs gap-1.5" onClick={saveScores} disabled={saving}>
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>

        {/* Event Selector */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <label className="text-xs font-medium text-muted-foreground">Select Event</label>
          <select value={selectedEvent} onChange={e => fetchScores(e.target.value)}
            className="mt-1.5 w-full h-10 rounded-xl bg-secondary border border-border text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Choose event...</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {!selectedEvent ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Select an event to view or enter scores</p>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <Trophy className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No approved delegates in this event</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border bg-secondary/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">#</div>
              <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => setSortBy("name")}>
                Delegate <ArrowUpDown className="h-3 w-3" />
              </div>
              <div className="col-span-2">Committee</div>
              <div className="col-span-2 text-center">Diplomacy</div>
              <div className="col-span-2 text-center">Research</div>
              <div className="col-span-1 text-center">Speaking</div>
              <div className="col-span-1 text-center cursor-pointer hover:text-foreground flex items-center justify-center gap-1" onClick={() => setSortBy("total")}>
                Total <ArrowUpDown className="h-3 w-3" />
              </div>
            </div>

            {/* Rows */}
            {sorted.map((s, i) => (
              <div key={s.delegate_user_id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-border/50 ${
                i === 0 ? "bg-primary/5" : i === 1 ? "bg-primary/3" : i === 2 ? "bg-primary/[0.02]" : ""
              }`}>
                <div className="col-span-1">
                  {i < 3 ? (
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? "bg-primary/20 text-primary" : i === 1 ? "bg-muted text-muted-foreground" : "bg-accent/10 text-accent"
                    }`}>{i + 1}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="col-span-3">
                  <p className="text-sm font-medium text-foreground truncate">{s.delegate_name}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-muted-foreground truncate">{s.committee_name}</span>
                </div>
                <div className="col-span-2">
                  <Input type="number" min={0} max={100} value={s.diplomacy} onChange={e => updateScore(i, "diplomacy", parseInt(e.target.value) || 0)}
                    className="h-8 text-center text-xs bg-secondary border-border rounded-lg" />
                </div>
                <div className="col-span-2">
                  <Input type="number" min={0} max={100} value={s.research} onChange={e => updateScore(i, "research", parseInt(e.target.value) || 0)}
                    className="h-8 text-center text-xs bg-secondary border-border rounded-lg" />
                </div>
                <div className="col-span-1">
                  <Input type="number" min={0} max={100} value={s.speaking} onChange={e => updateScore(i, "speaking", parseInt(e.target.value) || 0)}
                    className="h-8 text-center text-xs bg-secondary border-border rounded-lg" />
                </div>
                <div className="col-span-1 text-center">
                  <span className={`text-sm font-bold ${i === 0 ? "text-primary" : "text-foreground"}`}>{s.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EBMarksheet;
