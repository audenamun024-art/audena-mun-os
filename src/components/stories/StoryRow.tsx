import { useEffect, useState, useRef } from "react";
import { Plus, X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Story = { id: string; user_id: string; media_url: string; caption: string | null; created_at: string };
type ProfileLite = { user_id: string; full_name: string | null; avatar_url: string | null };

const StoryRow = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("stories").select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    const items = (data || []) as Story[];
    setStories(items);
    const ids = [...new Set(items.map((s) => s.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
  };

  useEffect(() => { fetchStories(); }, []);

  // auto-advance viewer
  useEffect(() => {
    if (viewerIdx === null) return;
    const t = setTimeout(() => {
      setViewerIdx((idx) => (idx !== null && idx < stories.length - 1 ? idx + 1 : null));
    }, 5000);
    return () => clearTimeout(t);
  }, [viewerIdx, stories.length]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/stories/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      const { error: insertErr } = await supabase.from("stories").insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: file.type.startsWith("video") ? "video" : "image",
      });
      if (insertErr) throw insertErr;
      toast.success("Story posted!");
      setUploadOpen(false);
      await fetchStories();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const current = viewerIdx !== null ? stories[viewerIdx] : null;
  const currentProfile = current ? profiles[current.user_id] : null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 py-4 border-b border-border">
        {/* Your story */}
        <button
          onClick={() => user ? setUploadOpen(true) : toast.error("Sign in first")}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className="story-ring relative">
            <div className="story-ring-inner w-[68px] h-[68px] rounded-full bg-card flex items-center justify-center overflow-hidden">
              {user ? (
                <span className="text-foreground text-sm font-bold">
                  {(user.user_metadata?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <Plus className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-glow">
              <Plus className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[11px] text-foreground font-medium">Your Story</span>
        </button>

        {stories.map((s, i) => {
          const p = profiles[s.user_id];
          const initials = p?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";
          return (
            <button key={s.id} onClick={() => setViewerIdx(i)} className="flex flex-col items-center gap-2 shrink-0">
              <div className="story-ring">
                <div className="story-ring-inner w-[68px] h-[68px] rounded-full bg-card flex items-center justify-center overflow-hidden">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-foreground text-sm font-bold">{initials}</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-foreground font-medium truncate max-w-[78px]">{p?.full_name?.split(" ")[0] || "User"}</span>
            </button>
          );
        })}
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={() => setUploadOpen(false)} />
          <div className="fixed inset-x-4 top-1/3 z-[95] max-w-sm mx-auto glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">New Story</h3>
              <button onClick={() => setUploadOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors disabled:opacity-50">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Tap to select photo/video"}</p>
            </button>
          </div>
        </>
      )}

      {/* Viewer */}
      {current && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setViewerIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); setViewerIdx((i) => (i !== null && i > 0 ? i - 1 : null)); }}
            className="absolute left-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur"><ChevronLeft className="h-5 w-5 text-white" /></button>
          <button onClick={(e) => { e.stopPropagation(); setViewerIdx((i) => (i !== null && i < stories.length - 1 ? i + 1 : null)); }}
            className="absolute right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur"><ChevronRight className="h-5 w-5 text-white" /></button>
          <button onClick={() => setViewerIdx(null)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur">
            <X className="h-5 w-5 text-white" />
          </button>

          {/* progress bars */}
          <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-white transition-all ${i < viewerIdx! ? "w-full" : i === viewerIdx ? "w-full animate-[shimmer_5s_linear]" : "w-0"}`} />
              </div>
            ))}
          </div>

          <div className="absolute top-8 left-3 flex items-center gap-2 z-10">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center overflow-hidden">
              {currentProfile?.avatar_url ? <img src={currentProfile.avatar_url} className="w-full h-full object-cover" /> : <span className="text-xs text-primary-foreground font-bold">{currentProfile?.full_name?.[0] || "U"}</span>}
            </div>
            <span className="text-sm text-white font-medium">{currentProfile?.full_name || "User"}</span>
          </div>

          <img src={current.media_url} alt="" className="max-h-[90vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

export default StoryRow;
