import AppLayout from "@/components/layout/AppLayout";
import { Edit, Upload, Menu, Video as VideoIcon, Image as ImageIcon, Grid3x3, Play, Heart, Receipt, Plus, X, ListChecks, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserType } from "@/hooks/useUserType";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "sonner";
import { uploadPublicFile } from "@/lib/storage";

type ContentTab = "videos" | "posts" | "tasks" | "transactions";

const MUN_OPTIONS = ["No experience", "1–3 conferences", "4–10 conferences", "10+ conferences"];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles } = useAuth();
  const { isOrganization } = useUserType();
  const { networkCount } = useConnections();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const initialTab = (searchParams.get("tab") as ContentTab) || "videos";
  const [contentTab, setContentTab] = useState<ContentTab>(initialTab);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    full_name: "", institution: "", bio: "",
    mun_experience: "", secretary_names: [] as string[],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [profileRes, videosRes, postsRes, paymentsRes, tasksRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("payments" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("tasks" as any).select("*").eq("assigned_to", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileRes?.data) {
        const p = profileRes.data as any;
        setProfile(p);
        setEditForm({
          full_name: p.full_name || "",
          institution: p.institution || "",
          bio: p.bio || "",
          mun_experience: p.mun_experience || "",
          secretary_names: Array.isArray(p.secretary_names) ? p.secretary_names : [],
        });
        setAvatarPreview(p.avatar_url || null);
      }
      setVideos((videosRes.data as any[]) || []);
      setPosts((postsRes.data as any[]) || []);
      setPayments((paymentsRes.data as any[]) || []);
      setTasks((tasksRes.data as any[]) || []);
    } catch (error) { console.error(error); toast.error("Could not load profile"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void fetchAll();
    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "videos", filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
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
        avatarUrl = await uploadPublicFile({ path: `${user.id}/avatars/${Date.now()}.${ext}`, file: avatarFile, onProgress: setUploadProgress });
      }
      // Build payload conditional on role: orgs don't store institution/phone here.
      const payload: any = {
        full_name: editForm.full_name,
        bio: editForm.bio,
        avatar_url: avatarUrl,
      };
      if (isOrganization) {
        payload.mun_experience = editForm.mun_experience || null;
        payload.secretary_names = (editForm.secretary_names || []).filter((s: string) => s.trim()).slice(0, 3);
      } else {
        payload.institution = editForm.institution;
      }
      const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
      if (error) throw error;
      setProfile({ ...profile, ...payload });
      setEditing(false);
      setAvatarFile(null);
      setUploadProgress(0);
      toast.success("Profile updated!");
    } catch (error: any) { toast.error(error.message || "Failed to update profile"); }
    finally { setSaving(false); }
  };

  const dp = profile || { full_name: user?.user_metadata?.full_name || "User", institution: "", bio: "", avatar_url: null };
  const initials = dp.full_name ? dp.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "U";
  const dropsCount = posts.length;
  const buzzCount = videos.length;

  const updateSecretary = (i: number, val: string) => {
    const arr = [...(editForm.secretary_names || [])];
    arr[i] = val;
    setEditForm({ ...editForm, secretary_names: arr });
  };
  const addSecretary = () => {
    if ((editForm.secretary_names || []).length >= 3) {
      toast.error("Maximum 3 secretaries allowed");
      return;
    }
    setEditForm({ ...editForm, secretary_names: [...(editForm.secretary_names || []), ""] });
  };
  const removeSecretary = (i: number) => {
    const arr = [...(editForm.secretary_names || [])];
    arr.splice(i, 1);
    setEditForm({ ...editForm, secretary_names: arr });
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-end">
          <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Profile header */}
        <div className="glass-panel rounded-2xl p-6 shadow-card">
          {loading ? (
            <div className="flex items-start gap-5">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 overflow-hidden shadow-glow">
                  {avatarPreview || dp.avatar_url ? (
                    <img src={avatarPreview || dp.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground text-2xl font-bold">{initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-foreground truncate">{dp.full_name}</h1>
                    {!isOrganization && (
                      <p className="text-xs text-muted-foreground mb-1.5">{dp.institution || "Add your institution"}</p>
                    )}
                    {isOrganization && (
                      <p className="text-xs text-muted-foreground mb-1.5">
                        {dp.mun_experience || "Set your MUN experience"}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {isOrganization && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">Organisation</span>
                      )}
                      {roles.has("admin") && (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full font-semibold">Admin</span>
                      )}
                    </div>
                  </div>
                  {/* Top-right points */}
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-gradient-primary leading-none">{dp.rank_points || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Points</p>
                  </div>
                </div>
              </div>

              {/* Stats: Buzz · Drops · Network */}
              <div className="flex justify-around mt-5 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{buzzCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buzz</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{dropsCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Drops</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{networkCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Network</p>
                </div>
              </div>

              {dp.bio && !editing && <p className="text-xs text-muted-foreground mt-4 leading-relaxed bg-secondary/50 rounded-xl p-3">{dp.bio}</p>}

              {/* Org-only summary chips for secretaries */}
              {isOrganization && !editing && Array.isArray(dp.secretary_names) && dp.secretary_names.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Secretaries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dp.secretary_names.map((s: string, i: number) => (
                      <span key={i} className="text-[11px] bg-secondary text-foreground px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {!editing ? (
                <Button className="w-full mt-4 bg-gradient-primary text-primary-foreground h-10 rounded-xl shadow-glow" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
                </Button>
              ) : (
                <div className="mt-4 space-y-3 bg-secondary/50 rounded-xl p-4">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-4 text-sm text-muted-foreground hover:border-primary/40">
                    <Upload className="h-4 w-4" /> Change photo
                  </button>

                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium">
                      {isOrganization ? "Full Name of the Organisation" : "Full Name"}
                    </Label>
                    <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="mt-1 bg-card border-border h-10 rounded-xl" />
                  </div>

                  {!isOrganization && (
                    <div>
                      <Label className="text-[11px] text-muted-foreground font-medium">Institution</Label>
                      <Input value={editForm.institution} onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                        className="mt-1 bg-card border-border h-10 rounded-xl" />
                    </div>
                  )}

                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium">Bio</Label>
                    <Input value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="mt-1 bg-card border-border h-10 rounded-xl" />
                  </div>

                  {isOrganization && (
                    <>
                      <div>
                        <Label className="text-[11px] text-muted-foreground font-medium">
                          How much experience do you have in Model United Nations (MUN)?
                        </Label>
                        <Select value={editForm.mun_experience} onValueChange={(v) => setEditForm({ ...editForm, mun_experience: v })}>
                          <SelectTrigger className="mt-1 bg-card border-border h-10 rounded-xl">
                            <SelectValue placeholder="Select experience" />
                          </SelectTrigger>
                          <SelectContent>
                            {MUN_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label className="text-[11px] text-muted-foreground font-medium">Secretary Names (max 3)</Label>
                          {(editForm.secretary_names?.length || 0) < 3 && (
                            <button type="button" onClick={addSecretary}
                              className="text-[11px] text-primary font-semibold flex items-center gap-1 hover:underline">
                              <Plus className="h-3 w-3" /> Add Secretary
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {(editForm.secretary_names || []).map((name: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                value={name}
                                placeholder={`Secretary ${i + 1}`}
                                onChange={(e) => updateSecretary(i, e.target.value)}
                                className="bg-card border-border h-10 rounded-xl flex-1"
                              />
                              <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0"
                                onClick={() => removeSecretary(i)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {(editForm.secretary_names?.length || 0) === 0 && (
                            <p className="text-[11px] text-muted-foreground italic">No secretaries added yet.</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {saving && uploadProgress > 0 && <Progress value={uploadProgress} className="h-2" />}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground rounded-lg" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Content tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1 border-t border-border pt-3">
            <button
              onClick={() => setContentTab("videos")}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                contentTab === "videos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <VideoIcon className="h-3.5 w-3.5" /> Buzz <span className="text-[10px] opacity-70">({videos.length})</span>
            </button>
            <button
              onClick={() => setContentTab("posts")}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                contentTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3x3 className="h-3.5 w-3.5" /> Drops <span className="text-[10px] opacity-70">({posts.length})</span>
            </button>
            <button
              onClick={() => setContentTab("tasks")}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                contentTab === "tasks" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" /> Tasks <span className="text-[10px] opacity-70">({payments.length})</span>
            </button>
          </div>

          {contentTab === "videos" && (
            <>
              {loading ? (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[9/16] rounded-md" />)}
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <VideoIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm">No buzz videos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {videos.map((v) => (
                    <div key={v.id} onClick={() => navigate("/buzz")}
                      className="relative aspect-[9/16] bg-secondary rounded-md overflow-hidden cursor-pointer group">
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1">
                        <Play className="h-2.5 w-2.5 text-white fill-white" />
                      </div>
                      <div className="absolute bottom-1 right-1.5 text-[9px] text-white/80 flex items-center gap-0.5">
                        <Play className="h-2 w-2" /> {v.views || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {contentTab === "posts" && (
            <>
              {loading ? (
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-md" />)}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm">No drops yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((p) => (
                    <div key={p.id} onClick={() => navigate("/explore")}
                      className="relative aspect-square bg-secondary rounded-md overflow-hidden cursor-pointer group">
                      <img src={p.image_url} alt={p.caption || ""} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-white" /> {p.likes_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {contentTab === "tasks" && (
            <>
              {payments.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-sm">No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="glass-panel rounded-xl p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{p.purpose || "Payment"}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()} · {p.status}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground">{p.currency} {Number(p.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
