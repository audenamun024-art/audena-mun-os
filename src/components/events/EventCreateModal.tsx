import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CommitteeDropdown, { DEFAULT_COMMITTEES } from "@/components/committees/CommitteeDropdown";

type Committee = { code: string; name: string; capacity: string };

const EventCreateModal = ({
  open, onClose, onCreated, userId,
}: { open: boolean; onClose: () => void; onCreated?: () => void; userId: string }) => {
  const [form, setForm] = useState({
    title: "", description: "", location: "",
    start_date: "", end_date: "", fee: "0",
  });
  const [committees, setCommittees] = useState<Committee[]>([{ name: "", capacity: "" }]);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!form.title) return toast.error("Title is required");
    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      return toast.error("End date must be after start date");
    }
    setSaving(true);
    try {
      const totalCapacity = committees.reduce((sum, c) => sum + (Number(c.capacity) || 0), 0);
      const { data: ev, error } = await supabase.from("events").insert({
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        fee: Number(form.fee) || 0,
        capacity: totalCapacity || null,
        created_by: userId,
        organizer_id: userId,
      }).select("id").single();
      if (error) throw error;

      const validCommittees = committees.filter((c) => c.name.trim() && Number(c.capacity) > 0);
      if (validCommittees.length > 0 && ev) {
        const { error: cErr } = await supabase.from("committees" as any).insert(
          validCommittees.map((c) => ({ event_id: ev.id, name: c.name.trim(), capacity: Number(c.capacity) }))
        );
        if (cErr) throw cErr;
      }
      toast.success("Event created!");
      onCreated?.();
      onClose();
    } catch (e: any) { toast.error(e.message || "Failed to create event"); }
    finally { setSaving(false); }
  };

  const updateCommittee = (i: number, k: keyof Committee, v: string) => {
    const arr = [...committees];
    arr[i] = { ...arr[i], [k]: v };
    setCommittees(arr);
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-8 md:inset-x-0 md:max-w-md md:mx-auto z-[95] glass-panel rounded-2xl p-5 shadow-elevated max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">Create Event</h3>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
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
                className="bg-card border-border rounded-xl h-10 mt-1"
              />
            </div>
          ))}
          <div>
            <Label className="text-[11px] text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-card border-border rounded-xl mt-1" rows={2} />
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[11px] text-muted-foreground font-semibold">Committees</Label>
              <button type="button" onClick={() => setCommittees([...committees, { name: "", capacity: "" }])}
                className="text-[11px] text-primary font-semibold flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {committees.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Committee name (e.g. UNGA)" value={c.name}
                    onChange={(e) => updateCommittee(i, "name", e.target.value)}
                    className="bg-card border-border rounded-xl h-10 flex-1" />
                  <Input placeholder="Cap" type="number" value={c.capacity}
                    onChange={(e) => updateCommittee(i, "capacity", e.target.value)}
                    className="bg-card border-border rounded-xl h-10 w-20" />
                  {committees.length > 1 && (
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0"
                      onClick={() => setCommittees(committees.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full bg-gradient-primary text-primary-foreground rounded-xl" onClick={submit} disabled={saving}>
            {saving ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default EventCreateModal;
