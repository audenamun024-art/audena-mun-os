import AppLayout from "@/components/layout/AppLayout";
import { Edit, Upload, Menu, Video as VideoIcon, Image as ImageIcon, Grid3x3, Play, Heart, Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import { toast } from "sonner";
import { uploadPublicFile } from "@/lib/storage";

type ContentTab = "videos" | "posts" | "transactions";

const Profile = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { networkCount } = useConnections();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [contentTab, setContentTab] = useState<ContentTab>("videos");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", institution: "", bio: "", phone: "" });
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
      const [profileRes, videosRes, postsRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("payments" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileRes?.data) {
        const p = profileRes.data as any;
        setProfile(p);
        setEditForm({ full_name: p.full_name || "", institution: p.institution || "", bio: p.bio || "", phone: p.phone || "" });
        setAvatarPreview(p.avatar_url || null);
      }
      setVideos((videosRes.data as any[]) || []);
      setPosts((postsRes.data as any[]) || []);
      setPayments((paymentsRes.data as any[]) || []);
    } catch (error) { console.error(error); toast.error("Could not load profile"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void fetchAll();
    if (!user) return;
    // Realtime: refresh when this user's content changes
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
      const payload = { ...editForm, avatar_url: avatarUrl };
      const { error } = await supabase.from("profiles").update(payload as any).eq("user_id", user.id);
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
  const totalContent = videos.length + posts.length;

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
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">{dp.full_name}</h1>
                  <p className="text-xs text-muted-foreground mb-1.5">{dp.institution || "Add your institution"}</p>
                  {roles.has("admin") && <span className="text-[10px] bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full font-semibold">Admin</span>}
                </div>
              </div>

              <div className="flex justify-around mt-5 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{totalContent}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{networkCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Network</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gradient-primary">{dp.rank_points || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
                </div>
              </div>

              {dp.bio && !editing && <p className="text-xs text-muted-foreground mt-4 leading-relaxed bg-secondary/50 rounded-xl p-3">{dp.bio}</p>}

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
                  {[
                    { label: "Full Name", key: "full_name" },
                    { label: "Institution", key: "institution" },
                    { label: "Bio", key: "bio" },
                    { label: "Phone", key: "phone" },
                  ].map((f) => (
                    <div key={f.key}>
                      <Label className="text-[11px] text-muted-foreground font-medium">{f.label}</Label>
                      <Input value={(editForm as any)[f.key]} onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                        className="mt-1 bg-card border-border h-10 rounded-xl" />
                    </div>
                  ))}
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
              <Grid3x3 className="h-3.5 w-3.5" /> Posts <span className="text-[10px] opacity-70">({posts.length})</span>
            </button>
            <button
              onClick={() => setContentTab("transactions")}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                contentTab === "transactions" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" /> Transactions <span className="text-[10px] opacity-70">({payments.length})</span>
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
                  <p className="text-xs text-muted-foreground mt-1">Upload your first video to fill the grid.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {videos.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => navigate("/buzz")}
                      className="relative aspect-[9/16] bg-secondary rounded-md overflow-hidden cursor-pointer group"
                    >
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1">
                        <Play className="h-2.5 w-2.5 text-white fill-white" />
                      </div>
                      {v.title && (
                        <p className="absolute bottom-1 left-1.5 right-1.5 text-[10px] text-white font-medium line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {v.title}
                        </p>
                      )}
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
                  <p className="font-semibold text-sm">No posts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Share something to the explore feed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate("/explore")}
                      className="relative aspect-square bg-secondary rounded-md overflow-hidden cursor-pointer group"
                    >
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
