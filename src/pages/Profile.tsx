import AppLayout from "@/components/layout/AppLayout";
import { Edit, Upload, Menu } from "lucide-react";
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const { networkCount } = useConnections();
  const [profile, setProfile] = useState<any>(null);
  const [dropCount, setDropCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", institution: "", bio: "", phone: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const [profileRes, videosRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("videos").select("id").eq("user_id", user.id),
        ]);
        if (profileRes?.data) {
          const p = profileRes.data as any;
          setProfile(p);
          setEditForm({ full_name: p.full_name || "", institution: p.institution || "", bio: p.bio || "", phone: p.phone || "" });
          setAvatarPreview(p.avatar_url || null);
        }
        setDropCount((videosRes.data as any[])?.length || 0);
      } catch (error) { console.error(error); toast.error("Could not load profile"); }
      finally { setLoading(false); }
    };
    void fetchAll();
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-end">
          <button onClick={() => navigate("/menu")} className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>

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
                  <p className="text-lg font-bold text-foreground">{dropCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{networkCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Network</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gradient-primary">✦</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hub</p>
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
      </div>
    </AppLayout>
  );
};

export default Profile;
