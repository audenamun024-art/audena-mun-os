import { useState } from "react";
import { X, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CommitteeDropdown, { DEFAULT_COMMITTEES } from "@/components/committees/CommitteeDropdown";

const committeeLabel = (code: string) => {
  const option = DEFAULT_COMMITTEES.find((item) => item.code === code);
  return option ? `${option.code} – ${option.name}` : code;
};

type Committee = { code: string; name: string; capacity: string };

const EventCreateModal = ({
  open, onClose, onCreated, userId,
}: { open: boolean; onClose: () => void; onCreated?: () => void; userId: string }) => {
  const [form, setForm] = useState({
    title: "", description: "", location: "",
    start_date: "", end_date: "", fee: "0",
  });
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const syncCommittees = (codes: string[]) => {
    setCommittees((current) => codes.map((code) => {
      const existing = current.find((item) => item.code === code);
      return existing || { code, name: committeeLabel(code), capacity: "50" };
    }));
  };

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      return toast.error("End date must be after start date");
    }
    setSaving(true);
    try {
      const validCommittees = committees.filter((c) => c.name.trim() && Number(c.capacity) > 0);
      const totalCapacity = validCommittees.reduce((sum, c) => sum + (Number(c.capacity) || 0), 0);
      const { data: ev, error } = await supabase.from("events").insert({
        title: form.title.trim(),
        description: form.description || null,
        location: form.location || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        fee: Number(form.fee) || 0,
        capacity: totalCapacity || null,
        category: "MUN",
        created_by: userId,
        organizer_id: userId,
      }).select("id").maybeSingle();
      if (error) throw error;

      if (validCommittees.length > 0 && ev) {
        const { error: cErr } = await supabase.from("committees" as any).insert(
          validCommittees.map((c) => ({ event_id: ev.id, name: c.name.trim(), capacity: Number(c.capacity) }))
        );
        if (cErr) throw cErr;
      }
      toast.success("Event created");
      onCreated?.();
      onClose();
    } catch (e: any) { toast.error(e.message || "Failed to create event"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-6 z-[95] mx-auto max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-elevated md:inset-x-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Create Event</h3>
            <p className="text-xs text-muted-foreground">Select committees first, then set capacity.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { k: "title", l: "Title" },
            { k: "location", l: "Location" },
            { k: "start_date", l: "Start date", type: "datetime-local" },
            { k: "end_date", l: "End date", type: "datetime-local" },
            { k: "fee", l: "Fee per delegate (INR)", type: "number" },
          ].map((f) => (
            <div key={f.k}>
              <Label className="text-[11px] text-muted-foreground">{f.l}</Label>
              <Input
                type={f.type || "text"}
                value={(form as any)[f.k]}
                onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                className="mt-1 h-10 rounded-xl border-border bg-background"
              />
            </div>
          ))}

          <div>
            <Label className="text-[11px] text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 rounded-xl border-border bg-background"
              rows={3}
            />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <Label className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">Committees</Label>
              <CommitteeDropdown
                multi
                value={committees.map((committee) => committee.code)}
                onChange={syncCommittees}
                label="All Committees"
                dropdownClassName="z-[130]"
              />
            </div>

            {committees.length > 0 ? (
              <div className="space-y-2">
                {committees.map((committee) => (
                  <div key={committee.code} className="rounded-xl border border-border bg-secondary/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{committee.code}</p>
                        <p className="text-xs leading-snug text-muted-foreground">{committee.name.replace(`${committee.code} – `, "")}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setCommittees(committees.filter((item) => item.code !== committee.code))}
                        aria-label={`Remove ${committee.code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Capacity"
                        type="number"
                        min="1"
                        value={committee.capacity}
                        onChange={(e) => setCommittees(committees.map((item) => item.code === committee.code ? { ...item, capacity: e.target.value } : item))}
                        className="h-9 rounded-lg border-border bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-center text-xs text-muted-foreground">
                No committee selected yet
              </div>
            )}
          </div>

          <Button className="w-full rounded-xl bg-gradient-primary text-primary-foreground" onClick={submit} disabled={saving}>
            {saving ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default EventCreateModal;
