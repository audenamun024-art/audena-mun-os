import AppLayout from "@/components/layout/AppLayout";
import { Trophy, Edit, Settings, LogOut, CheckCircle2, Circle, Play, Award, ChevronRight, Calendar, Briefcase } from "lucide-react";
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
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("user_tasks").select("*").eq("active", true),
        supabase.from("task_completions").select("*").eq("user_id", user.id),
        supabase.from("registrations").select("*, events(title, start_date)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setEditForm({
          full_name: profileRes.data.full_name || "",
          institution: profileRes.data.institution || "",
          bio: profileRes.data.bio || "",
          phone: profileRes.data.phone || "",
        });
      }
      if (tasksRes.data) setTasks(tasksRes.data);
      if (completionsRes.data) setCompletions(completionsRes.data);
      if (regsRes.data) setRegistrations(regsRes.data);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  const displayProfile = profile || {
    full_name: "Guest User",
    institution: "Sign in to view profile",
    total_muns: 0,
    awards_won: 0,
    rank_points: 0,
    bio: "",
    account_type: "personal",
  };

  const initials = displayProfile.full_name
    ? displayProfile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "GU";

  const completedTaskIds = new Set(completions.map((c: any) => c.task_id));
  const totalPoints = completions.reduce((sum: number, c: any) => sum + (c.points_awarded || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 border-2 border-accent/40 flex items-center justify-center shrink-0">
              <span className="text-accent text-2xl font-serif font-bold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-serif font-bold text-foreground truncate">{displayProfile.full_name}</h1>
              <p className="text-xs text-muted-foreground mb-1">{displayProfile.institution || "No institution set"}</p>
              <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium capitalize">{displayProfile.account_type}</span>
              <div className="flex gap-6 mt-3">
                {[
                  { label: "MUNs", value: displayProfile.total_muns },
                  { label: "Awards", value: displayProfile.awards_won },
                  { label: "Points", value: displayProfile.rank_points },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-base font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {displayProfile.bio && !editing && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{displayProfile.bio}</p>
          )}

          {!editing ? (
            <div className="flex gap-2 mt-4">
              <Button className="flex-1 bg-accent text-accent-foreground hover:opacity-90 h-9" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-border h-9"
                size="sm"
                onClick={() => toast.info("Use Edit Profile to update your account details")}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 bg-card rounded-xl border border-border p-4">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="mt-1 bg-secondary border-border h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Institution</Label>
                <Input value={editForm.institution} onChange={e => setEditForm({ ...editForm, institution: e.target.value })} className="mt-1 bg-secondary border-border h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bio</Label>
                <Input value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="mt-1 bg-secondary border-border h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1 bg-secondary border-border h-9" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-accent text-accent-foreground" onClick={handleSaveProfile}>Save</Button>
                <Button size="sm" variant="outline" className="border-border" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Section */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" />
              <h2 className="text-base font-serif font-bold text-foreground">Your Tasks</h2>
            </div>
            <span className="text-xs text-accent font-semibold">{totalPoints} pts earned</span>
          </div>

          <div className="space-y-2">
            {tasks.map((task: any) => {
              const completed = completedTaskIds.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                    completed ? "bg-accent/5 border-accent/20" : "bg-card border-border hover:border-accent/20"
                  }`}
                >
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${completed ? "text-accent" : "text-foreground"}`}>{task.title}</p>
                    <p className="text-[10px] text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-accent">+{task.points}</span>
                    {!completed && (
                      <Link to="/buzz">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Play className="h-3.5 w-3.5 text-accent" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sign in to see your tasks</p>
            )}
          </div>
        </section>

        {/* Recent Registrations */}
        {registrations.length > 0 && (
          <section className="px-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-accent" />
              <h2 className="text-base font-serif font-bold text-foreground">My Registrations</h2>
            </div>
            <div className="space-y-2">
              {registrations.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{(reg.events as any)?.title || "Event"}</p>
                    <p className="text-[10px] text-muted-foreground">{(reg.events as any)?.start_date}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    reg.status === "approved" ? "bg-green-500/20 text-green-400" :
                    reg.status === "rejected" ? "bg-destructive/20 text-destructive" :
                    "bg-accent/15 text-accent"
                  }`}>{reg.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sign Out */}
        <div className="px-4 pb-6">
          {user ? (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button className="w-full bg-accent text-accent-foreground hover:opacity-90">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
