import AppLayout from "@/components/layout/AppLayout";
import { Trophy, Edit, Settings, LogOut, CheckCircle2, Circle, Play, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", institution: "", bio: "", phone: "" });

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const [profileRes, tasksRes, completionsRes, regsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_tasks").select("*").eq("active", true),
        supabase.from("task_completions").select("*").eq("user_id", user.id),
        supabase.from("registrations").select("*, events(title, start_date)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditForm({ full_name: (profileRes.data as any).full_name || "", institution: (profileRes.data as any).institution || "", bio: (profileRes.data as any).bio || "", phone: (profileRes.data as any).phone || "" });
      }
      if (tasksRes.data) setTasks(tasksRes.data as any[]);
      if (completionsRes.data) setCompletions(completionsRes.data as any[]);
      if (regsRes.data) setRegistrations(regsRes.data as any[]);
    };
    fetchAll();
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(editForm).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    setProfile({ ...profile, ...editForm });
    setEditing(false);
    toast.success("Profile updated!");
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); toast.success("Signed out"); navigate("/auth"); };

  const dp = profile || { full_name: "Guest User", institution: "Sign in to view profile", muns_attended: 0, awards_won: 0, rank_points: 0, bio: "", account_type: "personal" };
  const initials = dp.full_name ? dp.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "GU";
  const completedTaskIds = new Set(completions.map((c: any) => c.task_id));
  const totalPoints = completions.reduce((sum: number, c: any) => sum + (c.points_awarded || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-2xl font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{dp.full_name}</h1>
              <p className="text-xs text-muted-foreground mb-1">{dp.institution || "No institution set"}</p>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold capitalize">{dp.account_type}</span>
              <div className="flex gap-6 mt-3">
                {[
                  { label: "MUNs", value: dp.muns_attended },
                  { label: "Awards", value: dp.awards_won },
                  { label: "Points", value: dp.rank_points },
                ].map((s) => (
                  <div key={s.label} className="text-center"><p className="text-base font-bold text-foreground">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
                ))}
              </div>
            </div>
          </div>
          {dp.bio && !editing && <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{dp.bio}</p>}
          {!editing ? (
            <div className="flex gap-2 mt-4">
              <Button className="flex-1 bg-gradient-primary text-primary-foreground h-9" size="sm" onClick={() => setEditing(true)}><Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile</Button>
              <Button variant="outline" className="flex-1 border-border h-9" size="sm" onClick={() => toast.info("Use Edit Profile to update")}><Settings className="h-3.5 w-3.5 mr-1.5" /> Settings</Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 bg-card rounded-xl border border-border p-4 shadow-card">
              <div><Label className="text-xs text-muted-foreground">Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="mt-1 bg-secondary border-border h-9" /></div>
              <div><Label className="text-xs text-muted-foreground">Institution</Label><Input value={editForm.institution} onChange={e => setEditForm({ ...editForm, institution: e.target.value })} className="mt-1 bg-secondary border-border h-9" /></div>
              <div><Label className="text-xs text-muted-foreground">Bio</Label><Input value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="mt-1 bg-secondary border-border h-9" /></div>
              <div><Label className="text-xs text-muted-foreground">Phone</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1 bg-secondary border-border h-9" /></div>
              <div className="flex gap-2"><Button size="sm" className="bg-primary text-primary-foreground" onClick={handleSaveProfile}>Save</Button><Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
            </div>
          )}
        </div>

        <section className="px-4">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /><h2 className="text-base font-bold text-foreground">Your Tasks</h2></div><span className="text-xs text-primary font-semibold">{totalPoints} pts earned</span></div>
          <div className="space-y-2">
            {tasks.map((task: any) => {
              const completed = completedTaskIds.has(task.id);
              return (
                <div key={task.id} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors shadow-card ${completed ? "bg-primary/5 border-primary/20" : "bg-card border-border hover:border-primary/20"}`}>
                  {completed ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0"><p className={`text-sm font-medium ${completed ? "text-primary" : "text-foreground"}`}>{task.title}</p><p className="text-[10px] text-muted-foreground">{task.description}</p></div>
                  <div className="flex items-center gap-2 shrink-0"><span className="text-xs font-bold text-primary">+{task.points}</span>{!completed && <Link to="/buzz"><Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Play className="h-3.5 w-3.5 text-primary" /></Button></Link>}</div>
                </div>
              );
            })}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sign in to see your tasks</p>}
          </div>
        </section>

        {registrations.length > 0 && (
          <section className="px-4">
            <div className="flex items-center gap-2 mb-3"><Calendar className="h-4 w-4 text-primary" /><h2 className="text-base font-bold text-foreground">My Registrations</h2></div>
            <div className="space-y-2">
              {registrations.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border shadow-card">
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground truncate">{(reg.events as any)?.title || "Event"}</p><p className="text-[10px] text-muted-foreground">{(reg.events as any)?.start_date}</p></div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${reg.status === "approved" ? "bg-success/10 text-success" : reg.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{reg.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="px-4 pb-6">
          {user ? (
            <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" /> Sign Out</Button>
          ) : (
            <Link to="/auth"><Button className="w-full bg-gradient-primary text-primary-foreground">Sign In</Button></Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
