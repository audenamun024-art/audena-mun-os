import AppLayout from "@/components/layout/AppLayout";
import { Heart, Play, Share2, Plus, Bookmark, MessageCircle, Send, MessageSquareMore } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import buzzImg from "@/assets/buzz-placeholder.jpg";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import BuzzUploadModal from "@/components/buzz/BuzzUploadModal";

const categories = ["All", "Best Speech", "Crisis Reaction", "Debate Moment", "Award"];
type CommentsByVideo = Record<string, any[]>;
type NameLookup = Record<string, string>;

const Buzz = () => {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [commentsByVideo, setCommentsByVideo] = useState<CommentsByVideo>({});
  const [activeCommentsVideoId, setActiveCommentsVideoId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [nameLookup, setNameLookup] = useState<NameLookup>({});

  const fetchNamesForUsers = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    if (!data) return;
    setNameLookup((prev) => {
      const next = { ...prev };
      (data as any[]).forEach((row) => { if (row.user_id) next[row.user_id] = row.full_name || "Delegate"; });
      return next;
    });
  };

  const fetchVideosAndComments = async () => {
    let query = supabase.from("videos").select("*").eq("flagged", false).order("created_at", { ascending: false });
    if (activeCategory !== "All") query = query.eq("category", activeCategory);
    const { data: videoRows } = await query;
    const currentVideos = videoRows || [];
    setVideos(currentVideos);
    const videoIds = currentVideos.map((v: any) => v.id);
    if (videoIds.length === 0) { setCommentsByVideo({}); return; }
    const { data: commentRows } = await supabase.from("video_comments").select("*").in("video_id", videoIds).order("created_at", { ascending: false });
    const grouped: CommentsByVideo = {};
    (commentRows || []).forEach((c: any) => { if (!grouped[c.video_id]) grouped[c.video_id] = []; grouped[c.video_id].push(c); });
    setCommentsByVideo(grouped);
    const involvedUserIds = new Set<string>();
    currentVideos.forEach((v: any) => v.user_id && involvedUserIds.add(v.user_id));
    (commentRows || []).forEach((c: any) => c.user_id && involvedUserIds.add(c.user_id));
    await fetchNamesForUsers([...involvedUserIds]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (user) {
        const [{ data: votes }, { data: bookmarks }] = await Promise.all([
          supabase.from("votes").select("video_id").eq("user_id", user.id),
          supabase.from("video_bookmarks").select("video_id").eq("user_id", user.id),
        ]);
        if (votes) setUserVotes(new Set((votes as any[]).map((v) => v.video_id)));
        if (bookmarks) setUserBookmarks(new Set((bookmarks as any[]).map((b) => b.video_id)));
      }
      await fetchVideosAndComments();
    };
    bootstrap();
  }, [user]);

  useEffect(() => { fetchVideosAndComments(); }, [activeCategory]);

  const handleLike = async (videoId: string) => {
    if (!user) { toast.error("Sign in to like videos"); return; }
    if (userVotes.has(videoId)) {
      await supabase.from("votes").delete().eq("user_id", user.id).eq("video_id", videoId);
      setUserVotes((prev) => { const c = new Set(prev); c.delete(videoId); return c; });
    } else {
      await supabase.from("votes").insert([{ user_id: user.id, video_id: videoId }]);
      setUserVotes((prev) => new Set(prev).add(videoId));
    }
  };

  const handleBookmark = async (videoId: string) => {
    if (!user) { toast.error("Sign in to save videos"); return; }
    if (userBookmarks.has(videoId)) {
      await supabase.from("video_bookmarks").delete().eq("user_id", user.id).eq("video_id", videoId);
      setUserBookmarks((prev) => { const c = new Set(prev); c.delete(videoId); return c; });
      toast.success("Removed from saved");
    } else {
      await supabase.from("video_bookmarks").insert([{ user_id: user.id, video_id: videoId }]);
      setUserBookmarks((prev) => new Set(prev).add(videoId));
      toast.success("Saved to bookmarks");
    }
  };

  const handleCommentSubmit = async (videoId: string) => {
    const payload = commentDraft.trim();
    if (!payload || !user) { if (!user) toast.error("Sign in to comment"); return; }
    const { data, error } = await supabase.from("video_comments").insert([{ video_id: videoId, user_id: user.id, content: payload }]).select("*").single();
    if (error) { toast.error(error.message); return; }
    setCommentsByVideo((prev) => ({ ...prev, [videoId]: [data, ...(prev[videoId] || [])] }));
    setCommentDraft("");
    toast.success("Comment posted");
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/buzz?video=${video.id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied"); }
    } catch { /* cancelled */ }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Buzz</h1>
            <p className="text-xs text-muted-foreground">MUN reels, speeches, crisis moments</p>
          </div>
          <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 h-8 text-xs" onClick={() => { if (!user) { toast.error("Sign in to upload"); return; } setShowUpload(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}>{cat}</button>
          ))}
        </div>

        <div className="space-y-5 pb-6">
          {videos.length === 0 && (
            <div className="text-center py-12"><Play className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No videos yet. Be the first to post!</p></div>
          )}
          {videos.map((video: any) => {
            const comments = commentsByVideo[video.id] || [];
            const showAll = activeCommentsVideoId === video.id;
            const toRender = showAll ? comments : comments.slice(0, 2);
            return (
              <article key={video.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-semibold">{(nameLookup[video.user_id] || "M").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{nameLookup[video.user_id] || "MUN Delegate"}</p>
                    <p className="text-[10px] text-muted-foreground">{video.category}</p>
                  </div>
                </div>
                <AspectRatio ratio={9 / 16} className="bg-secondary">
                  {video.video_url ? (
                    <video controls playsInline preload="metadata" poster={video.thumbnail_url || buzzImg} className="w-full h-full object-cover"><source src={video.video_url} /></video>
                  ) : (
                    <img src={video.thumbnail_url || buzzImg} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </AspectRatio>
                <div className="p-3.5 space-y-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleLike(video.id)} className={`transition-colors ${userVotes.has(video.id) ? "text-destructive" : "text-foreground hover:text-destructive"}`}>
                      <Heart className={`h-5 w-5 ${userVotes.has(video.id) ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={() => setActiveCommentsVideoId((p) => p === video.id ? null : video.id)} className="text-foreground hover:text-primary transition-colors"><MessageCircle className="h-5 w-5" /></button>
                    <button onClick={() => handleShare(video)} className="text-foreground hover:text-primary transition-colors"><Share2 className="h-5 w-5" /></button>
                    <button onClick={() => handleBookmark(video.id)} className={`ml-auto transition-colors ${userBookmarks.has(video.id) ? "text-primary" : "text-foreground hover:text-primary"}`}>
                      <Bookmark className={`h-5 w-5 ${userBookmarks.has(video.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{video.title}</p>
                  <div className="space-y-2">
                    <button onClick={() => setActiveCommentsVideoId((p) => p === video.id ? null : video.id)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <MessageSquareMore className="h-3.5 w-3.5" />{comments.length > 0 ? `View comments (${comments.length})` : "Be the first to comment"}
                    </button>
                    {toRender.map((c: any) => (
                      <p key={c.id} className="text-xs text-foreground leading-relaxed"><span className="font-semibold mr-1">{nameLookup[c.user_id] || "Delegate"}</span>{c.content}</p>
                    ))}
                    {showAll && (
                      <div className="flex items-center gap-2 pt-1">
                        <Input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="Add a comment..." className="h-9 bg-secondary border-border text-xs" />
                        <Button size="sm" className="h-9 bg-primary text-primary-foreground" onClick={() => handleCommentSubmit(video.id)}><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {user && <BuzzUploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={() => fetchVideosAndComments()} userId={user.id} />}
      </div>
    </AppLayout>
  );
};

export default Buzz;
