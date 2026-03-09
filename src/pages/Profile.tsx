import AppLayout from "@/components/layout/AppLayout";
import { Edit, CheckCircle2, Circle, Play, Award, Calendar, MapPin, Menu, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, roles, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", institution: "", bio: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(false);

  const isDelegateOnly = !roles.has("organizer") && !roles.has("eb") && !roles.has("admin");

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) { setLoading(false); return; }
      const profilePromise = supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const regsPromise = supabase.from("registrations").select("*, events(title, start_date, location)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      const tasksPromise = isDelegateOnly ? supabase.from("user_tasks").select("*").eq("active", true) : null;
      const completionsPromise = isDelegateOnly ? supabase.from("task_completions").select("*").eq("user_id", user.id) : null;

      const [profileRes, regsRes, tasksRes, completionsRes] = await Promise.all([
        profilePromise, regsPromise, tasksPromise, completionsPromise,
      ]);
      if (profileRes?.data) {
        setProfile(profileRes.data);
        setEditForm({
          full_name: (profileRes.data as any).full_name || "",
          institution: (profileRes.data as any).institution || "",
          bio: (profileRes.data as any).bio || "",
          phone: (profileRes.data as any).phone || "",
        });
      }
      if (regsRes?.data) setRegistrations(regsRes.data as any[]);
      if (tasksRes?.data) setTasks(tasksRes.data as any[]);
      if (completionsRes?.data) setCompletions(completionsRes.data as any[]);
      setLoading(false);
    };
    fetchAll();
  }, [user, isDelegateOnly]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(editForm).eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    setProfile({ ...profile, ...editForm });
    setEditing(false);
    toast.success("Profile updated!");
  };

  const dp = profile || { full_name: "Guest User", institution: "Sign in to view profile", muns_attended: 0, awards_won: 0, rank_points: 0, bio: "", account_type: "personal" };
  const initials = dp.full_name ? dp.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "GU";
  const completedTaskIds = new Set(completions.map((c: any) => c.task_id));
  const totalPoints = completions.reduce((sum: number, c: any) => sum + (c.points_awarded || 0), 0);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
    catch { return d; }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Top bar with menu icon */}
        <div className="flex items-center justify-end">
          <button
            onClick={() => navigate("/menu")}
            className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Header — Instagram style */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          {loading ? (
            <div className="flex items-start gap-5">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-2xl font-bold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">{dp.full_name}</h1>
                  <p className="text-xs text-muted-foreground mb-1.5">{dp.institution || "No institution set"}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold capitalize">{dp.account_type}</span>
                    {roles.has("organizer") && <span className="text-[10px] bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-semibold">Organizer</span>}
                    {roles.has("eb") && <span className="text-[10px] bg-warning/10 text-warning px-2.5 py-0.5 rounded-full font-semibold">EB Member</span>}
                    {roles.has("admin") && <span className="text-[10px] bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full font-semibold">Admin</span>}
                  </div>
                </div>
              </div>

              {/* Instagram-style stats */}
              <div className="flex justify-around mt-5 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">Network</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">Drop</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">0</p>
                  <p className="text-[10px] text-muted-foreground">Connect</p>
                </div>
              </div>

              {dp.bio && !editing && <p className="text-xs text-muted-foreground mt-4 leading-relaxed bg-secondary/50 rounded-xl p-3">{dp.bio}</p>}
              {!editing ? (
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1 bg-gradient-primary text-primary-foreground h-10 rounded-xl" size="sm" onClick={() => setEditing(true)}>
                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="mt-4 space-y-3 bg-secondary/50 rounded-xl p-4">
                  {[
                    { label: "Full Name", key: "full_name" },
                    { label: "Institution", key: "institution" },
                    { label: "Bio", key: "bio" },
                    { label: "Phone", key: "phone" },
                  ].map(field => (
                    <div key={field.key}>
                      <Label className="text-[11px] text-muted-foreground font-medium">{field.label}</Label>
                      <Input
                        value={(editForm as any)[field.key]}
                        onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                        className="mt-1 bg-card border-border h-10 rounded-xl"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="bg-primary text-primary-foreground rounded-lg" onClick={handleSaveProfile}>Save</Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Your Tasks with expandable panel */}
        {isDelegateOnly && tasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <ClipboardList className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">Your Tasks</h2>
              </button>
              <span className="text-xs text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full">{totalPoints} pts earned</span>
            </div>
            {showTasks && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                {tasks.map((task: any) => {
                  const completed = completedTaskIds.has(task.id);
                  return (
                    <div key={task.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all shadow-card ${
                      completed ? "bg-primary/5 border-primary/15" : "bg-card border-border hover:border-primary/15"
                    }`}>
                      {completed ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${completed ? "text-primary" : "text-foreground"}`}>{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+{task.points}</span>
                        {!completed && (
                          <Link to="/buzz">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg"><Play className="h-3.5 w-3.5 text-primary" /></Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Registrations */}
        {registrations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">My Registrations</h2>
            </div>
            <div className="space-y-2">
              {registrations.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-card">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{(reg.events as any)?.title || "Event"}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {(reg.events as any)?.location && <><MapPin className="h-3 w-3" />{(reg.events as any).location}</>}
                      {(reg.events as any)?.start_date && <><span>·</span>{formatDate((reg.events as any).start_date)}</>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                    reg.status === "approved" ? "bg-success/10 text-success" :
                    reg.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-primary/10 text-primary"
                  }`}>{reg.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Profile;
