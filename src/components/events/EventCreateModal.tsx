import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EventCreateModal = ({
  open, onClose, onCreated, userId,
}: { open: boolean; onClose: () => void; onCreated?: () => void; userId: string }) => {
  const [form, setForm] = useState({ title: "", description: "", location: "", start_date: "", fee: "0", capacity: "" });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!form.title) return toast.error("Title is required");
    setSaving(true);
    try {
      const { error } = await supabase.from("events").insert({
        title: form.title,
        description: form.description || null,
        location: form.location || null,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        fee: Number(form.fee) || 0,
        capacity: form.capacity ? Number(form.capacity) : null,
        created_by: userId,
        organizer_id: userId,
      });
      if (error) throw error;
      toast.success("Event created!");
      onCreated?.();
      onClose();
    } catch (e: any) { toast.error(e.message || "Failed to create event"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-12 md:inset-x-0 md:max-w-md md:mx-auto z-[95] glass-panel rounded-2xl p-5 shadow-elevated max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground">Create Event</h3>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          {[
            { k: "title", l: "Title" },
            { k: "location", l: "Location" },
            { k: "start_date", l: "Start date", type: "datetime-local" },
            { k: "fee", l: "Fee (INR)", type: "number" },
            { k: "capacity", l: "Capacity", type: "number" },
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
              className="bg-card border-border rounded-xl mt-1" rows={3} />
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
