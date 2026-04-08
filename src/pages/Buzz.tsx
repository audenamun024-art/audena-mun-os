import AppLayout from "@/components/layout/AppLayout";
import { Play, Plus, Eye } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BuzzUploadModal from "@/components/buzz/BuzzUploadModal";
import BuzzVideoCard from "@/components/buzz/BuzzVideoCard";
import FullscreenReel from "@/components/buzz/FullscreenReel";

type CommentsByVideo = Record<string, any[]>;
type NameLookup = Record<string, string>;

const Buzz = () => {
  const { user, roles } = useAuth();
  const isAdmin = roles.has("admin");
  const [showUpload, setShowUpload] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [commentsByVideo, setCommentsByVideo] = useState<CommentsByVideo>({});
  const [nameLookup, setNameLookup] = useState<NameLookup>({});
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const [fullscreenVideo, setFullscreenVideo] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLElement>>(new Map());

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
    let query = supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (!isAdmin) query = query.eq("flagged", false);
    const { data: videoRows } = await query;
    const currentVideos = videoRows || [];
    setVideos(currentVideos);

    const videoIds = currentVideos.map((v: any) => v.id);
    if (videoIds.length === 0) { setCommentsByVideo({}); setVoteCounts({}); return; }

    const [{ data: commentRows }, { data: allVotes }] = await Promise.all([
      supabase.from("video_comments").select("*").in("video_id", videoIds).order("created_at", { ascending: false }),
      supabase.from("votes").select("video_id").in("video_id", videoIds),
    ]);

    const counts: Record<string, number> = {};
    (allVotes || []).forEach((v: any) => { counts[v.video_id] = (counts[v.video_id] || 0) + 1; });
    setVoteCounts(counts);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible: { id: string; ratio: number } | null = null;
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-video-id");
          if (id && entry.intersectionRatio > (mostVisible?.ratio || 0.5)) {
            mostVisible = { id, ratio: entry.intersectionRatio };
          }
        });
        if (mostVisible) setVisibleVideoId(mostVisible.id);
      },
      { threshold: [0.5, 0.75, 1.0] }
    );
    videoRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [videos]);

  const handleLike = async (videoId: string) => {
    if (!user) { toast.error("Sign in to like videos"); return; }
    if (userVotes.has(videoId)) {
      await supabase.from("votes").delete().eq("user_id", user.id).eq("video_id", videoId);
      setUserVotes((prev) => { const c = new Set(prev); c.delete(videoId); return c; });
      setVoteCounts((prev) => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 1) - 1) }));
    } else {
      await supabase.from("votes").insert([{ user_id: user.id, video_id: videoId }]);
      setUserVotes((prev) => new Set(prev).add(videoId));
      setVoteCounts((prev) => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
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

  const handleCommentSubmit = async (videoId: string, content: string) => {
    if (!user) { toast.error("Sign in to comment"); return; }
    const { data, error } = await supabase.from("video_comments").insert([{ video_id: videoId, user_id: user.id, content }]).select("*").single();
    if (error) { toast.error(error.message); return; }
    setCommentsByVideo((prev) => ({ ...prev, [videoId]: [data, ...(prev[videoId] || [])] }));
    toast.success("Comment posted");
  };

  const handleDeleteComment = async (commentId: string, videoId: string) => {
    await supabase.from("video_comments").delete().eq("id", commentId);
    setCommentsByVideo((prev) => ({ ...prev, [videoId]: (prev[videoId] || []).filter((c: any) => c.id !== commentId) }));
    toast.success("Comment deleted");
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/buzz?video=${video.id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied"); }
    } catch { /* cancelled */ }
  };

  const handleFlagVideo = async (videoId: string) => {
    await supabase.from("videos").update({ flagged: true }).eq("id", videoId);
    setVideos(videos.map(v => v.id === videoId ? { ...v, flagged: true } : v));
    toast.success("Video flagged");
  };

  const handleUnflagVideo = async (videoId: string) => {
    await supabase.from("videos").update({ flagged: false }).eq("id", videoId);
    setVideos(videos.map(v => v.id === videoId ? { ...v, flagged: false } : v));
    toast.success("Video unflagged");
  };

  const handleDeleteVideo = async (videoId: string) => {
    await supabase.from("videos").delete().eq("id", videoId);
    setVideos(videos.filter(v => v.id !== videoId));
    toast.success("Video deleted");
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {/* Minimal header */}
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Buzz</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full">
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-primary font-medium">Admin</span>
              </div>
            )}
            <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 h-8 text-xs rounded-full"
              onClick={() => { if (!user) { toast.error("Sign in to upload"); return; } setShowUpload(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create
            </Button>
          </div>
        </div>

        {/* Feed - snap scroll */}
        <div ref={containerRef} className="snap-y snap-mandatory">
          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center snap-start">
              <Play className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No videos yet. Be the first to post!</p>
            </div>
          )}
          {videos.map((video: any) => (
            <div
              key={video.id}
              data-video-id={video.id}
              ref={(el) => { if (el) videoRefs.current.set(video.id, el); else videoRefs.current.delete(video.id); }}
              className="snap-start"
            >
              <BuzzVideoCard
                video={video}
                nameLookup={nameLookup}
                comments={commentsByVideo[video.id] || []}
                likeCount={voteCounts[video.id] || 0}
                isLiked={userVotes.has(video.id)}
                isBookmarked={userBookmarks.has(video.id)}
                isAdmin={isAdmin}
                isOwner={user?.id === video.user_id}
                userId={user?.id}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
                onComment={handleCommentSubmit}
                onDeleteComment={handleDeleteComment}
                onFlag={handleFlagVideo}
                onUnflag={handleUnflagVideo}
                onDelete={handleDeleteVideo}
                onOpenFullscreen={setFullscreenVideo}
                isVisible={visibleVideoId === video.id}
              />
            </div>
          ))}
        </div>

        {user && <BuzzUploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={() => fetchVideosAndComments()} userId={user.id} />}
      </div>

      {fullscreenVideo && (
        <FullscreenReel
          video={fullscreenVideo}
          isLiked={userVotes.has(fullscreenVideo.id)}
          isBookmarked={userBookmarks.has(fullscreenVideo.id)}
          likeCount={voteCounts[fullscreenVideo.id] || 0}
          nameLookup={nameLookup}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onClose={() => setFullscreenVideo(null)}
        />
      )}
    </AppLayout>
  );
};

export default Buzz;
