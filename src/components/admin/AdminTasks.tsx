import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, CheckCircle2, Clock, Loader2, Calendar, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  created_at: string;
};

const statusMeta: Record<Task["status"], { label: string; cls: string; icon: any }> = {
  pending: { label: "Pending", cls: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30", icon: Clock },
  in_progress: { label: "In Progress", cls: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Loader2 },
  completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
};

const priorityMeta: Record<Task["priority"], string> = {
  low: "bg-secondary text-muted-foreground",
  medium: "bg-accent/15 text-accent border-accent/30",
  high: "bg-destructive/15 text-destructive border-destructive/30",
};

const AdminTasks = ({ profiles }: { profiles: any[] }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; editing: Task | null }>({ open: false, editing: null });
  const empty = { title: "", description: "", assigned_to: "", deadline: "", priority: "medium" as const, status: "pending" as const };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks" as any).select("*").order("created_at", { ascending: false });
    setTasks((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const ch = supabase
      .channel("admin-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const openCreate = () => { setForm(empty); setDialog({ open: true, editing: null }); };
  const openEdit = (t: Task) => {
    setForm({
      title: t.title, description: t.description || "", assigned_to: t.assigned_to || "",
      deadline: t.deadline ? t.deadline.slice(0, 16) : "", priority: t.priority, status: t.status,
    });
    setDialog({ open: true, editing: t });
  };

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        assigned_to: form.assigned_to || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        priority: form.priority,
        status: form.status,
      };
      if (dialog.editing) {
        const { error } = await supabase.from("tasks" as any).update(payload).eq("id", dialog.editing.id);
        if (error) throw error;
        toast.success("Task updated");
      } else {
        const { error } = await supabase.from("tasks" as any).insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("Task created");
      }
      setDialog({ open: false, editing: null });
    } catch (e: any) { toast.error(e.message || "Failed"); }
    finally { setSaving(false); }
  };

  const remove = async (t: Task) => {
    if (!window.confirm(`Delete task "${t.title}"?`)) return;
    const { error } = await supabase.from("tasks" as any).delete().eq("id", t.id);
    if (error) toast.error(error.message); else toast.success("Deleted");
  };

  const markComplete = async (t: Task) => {
    const { error } = await supabase.from("tasks" as any).update({ status: "completed" }).eq("id", t.id);
    if (error) toast.error(error.message);
  };

  const profileName = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = profiles.find((x) => x.user_id === id);
    return p?.full_name || p?.user_id?.slice(0, 6) || "Unknown";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Tasks</h2>
          <p className="text-xs text-muted-foreground">Create and assign work to users.</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Create Task
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tasks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <p className="font-semibold text-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground mt-1">Hit "Create Task" to assign your first one.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasks.map((t) => {
            const sm = statusMeta[t.status];
            const StatusIcon = sm.icon;
            const overdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed";
            return (
              <div key={t.id} className="glass-panel rounded-2xl p-4 space-y-3 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{t.title}</h3>
                  <Badge variant="outline" className={`${priorityMeta[t.priority]} text-[10px] uppercase shrink-0`}>
                    <Flag className="h-3 w-3 mr-1" />{t.priority}
                  </Badge>
                </div>
                {t.description && <p className="text-xs text-muted-foreground line-clamp-3">{t.description}</p>}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate">→ {profileName(t.assigned_to)}</span>
                  {t.deadline && (
                    <span className={`flex items-center gap-1 ${overdue ? "text-destructive font-semibold" : ""}`}>
                      <Calendar className="h-3 w-3" />
                      {new Date(t.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Badge variant="outline" className={`${sm.cls} text-[10px]`}>
                    <StatusIcon className={`h-3 w-3 mr-1 ${t.status === "in_progress" ? "animate-spin" : ""}`} />
                    {sm.label}
                  </Badge>
                  <div className="flex gap-1">
                    {t.status !== "completed" && (
                      <button onClick={() => markComplete(t)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600" title="Mark complete">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-secondary" title="Edit">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(t)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(v) => !v && setDialog({ open: false, editing: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>Assign work, set a deadline and priority.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div>
              <Label className="text-xs">Assign to</Label>
              <Select value={form.assigned_to || "unassigned"} onValueChange={(v) => setForm({ ...form, assigned_to: v === "unassigned" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Deadline</Label>
              <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cancel</Button>
            <Button onClick={submit} disabled={saving} className="bg-primary text-primary-foreground">
              {saving ? "Saving…" : dialog.editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTasks;
