import AppLayout from "@/components/layout/AppLayout";
import { Edit, CheckCircle2, Circle, Play, Calendar, MapPin, Menu, ClipboardList, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { uploadPublicFile } from "@/lib/storage";
import { withTimeout } from "@/lib/async";

const Profile = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", institution: "", bio: "", phone: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isDelegateOnly = !roles.has("organizer") && !roles.has("eb") && !roles.has("admin");

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const profilePromise = supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
        const regsPromise = supabase
          .from("registrations")
          .select("*, events(title, start_date, location)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        const tasksPromise = isDelegateOnly ? supabase.from("user_tasks").select("*").eq("active", true) : Promise.resolve({ data: [] as any[] });
        const completionsPromise = isDelegateOnly
          ? supabase.from("task_completions").select("*").eq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] });

        const [profileRes, regsRes, tasksRes, completionsRes] = await withTimeout(
          Promise.all([profilePromise, regsPromise, tasksPromise, completionsPromise]),
          15000,
          "Profile request timed out"
        );

        if (profileRes?.data) {
          setProfile(profileRes.data);
          setEditForm({
            full_name: (profileRes.data as any).full_name || "",
            institution: (profileRes.data as any).institution || "",
            bio: (profileRes.data as any).bio || "",
            phone: (profileRes.data as any).phone || "",
          });
          setAvatarPreview((profileRes.data as any).avatar_url || null);
        }

        setRegistrations((regsRes?.data as any[]) || []);
        setTasks((tasksRes?.data as any[]) || []);
        setCompletions((completionsRes?.data as any[]) || []);
      } catch (error) {
        console.error(error);
        toast.error("Could not load your profile right now");
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [user, isDelegateOnly]);

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setAvatarFile(selected);
    setAvatarPreview(URL.createObjectURL(selected));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        avatarUrl = await uploadPublicFile({
          path: `${user.id}/avatars/${Date.now()}.${ext}`,
          file: avatarFile,
          onProgress: setUploadProgress,
        });
      }

      const payload = { ...editForm, avatar_url: avatarUrl };
      const { error } = await withTimeout(supabase.from("profiles").update(payload as any).eq("user_id", user.id), 15000, "Profile save timed out");
      if (error) throw error;

      setProfile({ ...profile, ...payload });
      setEditing(false);
      setAvatarFile(null);
      setUploadProgress(0);
      toast.success("Profile updated!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const dp = profile || {
    full_name: "Guest User",
    institution: "Sign in to view profile",
    bio: "",
    account_type: "personal",
    avatar_url: null,
  };
  const initials = dp.full_name ? dp.full_name.split(" ").map((name: string) => name[0]).join("").slice(0, 2).toUpperCase() : "GU";
  const completedTaskIds = new Set(completions.map((completion: any) => completion.task_id));
  const totalPoints = completions.reduce((sum: number, completion: any) => sum + (completion.points_awarded || 0), 0);

  const formatDate = (dateValue: string) => {
    try {
      return new Date(dateValue).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch {
      return dateValue;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-end">
          <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          {loading ? (
            <div className="flex items-start gap-5">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 overflow-hidden">
                  {avatarPreview || dp.avatar_url ? (
                    <img src={avatarPreview || dp.avatar_url} alt={`${dp.full_name} avatar`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground text-2xl font-bold">{initials}</span>
                  )}
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
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium">Profile Photo</Label>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-1.5 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-4 text-sm text-muted-foreground hover:border-primary/40"
                    >
                      <Upload className="h-4 w-4" /> Upload avatar
                    </button>
                  </div>

                  {[
                    { label: "Full Name", key: "full_name" },
                    { label: "Institution", key: "institution" },
                    { label: "Bio", key: "bio" },
                    { label: "Phone", key: "phone" },
                  ].map((field) => (
                    <div key={field.key}>
                      <Label className="text-[11px] text-muted-foreground font-medium">{field.label}</Label>
                      <Input
                        value={(editForm as any)[field.key]}
                        onChange={(event) => setEditForm({ ...editForm, [field.key]: event.target.value })}
                        className="mt-1 bg-card border-border h-10 rounded-xl"
                      />
                    </div>
                  ))}

                  {saving && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-[10px] text-muted-foreground text-center">Uploading profile photo...</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="bg-primary text-primary-foreground rounded-lg" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {isDelegateOnly && tasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setShowTasks(!showTasks)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all shadow-card ${
                        completed ? "bg-primary/5 border-primary/15" : "bg-card border-border hover:border-primary/15"
                      }`}
                    >
                      {completed ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${completed ? "text-primary" : "text-foreground"}`}>{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+{task.points}</span>
                        {!completed && (
                          <Link to="/buzz">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg">
                              <Play className="h-3.5 w-3.5 text-primary" />
                            </Button>
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

        {registrations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">My Registrations</h2>
            </div>
            <div className="space-y-2">
              {registrations.map((registration: any) => (
                <div key={registration.id} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-card">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{(registration.events as any)?.title || "Event"}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      {(registration.events as any)?.location && (
                        <>
                          <MapPin className="h-3 w-3" />
                          {(registration.events as any).location}
                        </>
                      )}
                      {(registration.events as any)?.start_date && (
                        <>
                          <span>·</span>
                          {formatDate((registration.events as any).start_date)}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                      registration.status === "approved"
                        ? "bg-success/10 text-success"
                        : registration.status === "rejected"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {registration.status}
                  </span>
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
