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
import ShareModal from "@/components/buzz/ShareModal";

type CommentsByVideo = Record<string, any[]>;
type NameLookup = Record<string, string>;
type InteractionState = Record<string, { accurate: boolean; checked: boolean }>;

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
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [shareVideo, setShareVideo] = useState<any>(null);
  const [interactions, setInteractions] = useState<InteractionState>({});
  const [accurateCounts, setAccurateCounts] = useState<Record<string, number>>({});
  const [checkCounts, setCheckCounts] = useState<Record<string, number>>({});
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

    const [{ data: commentRows }, { data: allVotes }, { data: allInteractions }] = await Promise.all([
      supabase.from("video_comments").select("*").in("video_id", videoIds).order("created_at", { ascending: false }),
      supabase.from("votes").select("video_id").in("video_id", videoIds),
      supabase.from("buzz_interactions").select("*").in("video_id", videoIds),
    ]);

    // Vote counts
    const counts: Record<string, number> = {};
    (allVotes || []).forEach((v: any) => { counts[v.video_id] = (counts[v.video_id] || 0) + 1; });
    setVoteCounts(counts);

    // Accurate/Check counts from all interactions
    const ac: Record<string, number> = {};
    const cc: Record<string, number> = {};
    (allInteractions || []).forEach((i: any) => {
      if (i.accurate) ac[i.video_id] = (ac[i.video_id] || 0) + 1;
      if (i.checked) cc[i.video_id] = (cc[i.video_id] || 0) + 1;
    });
    setAccurateCounts(ac);
    setCheckCounts(cc);

    // User's own interaction states
    if (user) {
      const userInts: InteractionState = {};
      (allInteractions || []).forEach((i: any) => {
        if (i.user_id === user.id) {
          userInts[i.video_id] = { accurate: i.accurate, checked: i.checked };
        }
      });
      setInteractions(userInts);
    }

    // Comments
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

  // Realtime subscriptions for buzz_interactions, votes, and comments
  useEffect(() => {
    const channel = supabase
      .channel("buzz-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "buzz_interactions" }, (payload: any) => {
        const row = payload.new;
        if (!row || row.user_id === user?.id) return;
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          setAccurateCounts((prev) => {
            const vid = row.video_id;
            // Recalc would be ideal but for live feel, just adjust
            return prev;
          });
          // Refetch counts for accuracy
          void fetchVideosAndComments();
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, (payload: any) => {
        const row = payload.new || payload.old;
        if (!row || row.user_id === user?.id) return;
        if (payload.eventType === "INSERT") {
          setVoteCounts((prev) => ({ ...prev, [row.video_id]: (prev[row.video_id] || 0) + 1 }));
        } else if (payload.eventType === "DELETE") {
          setVoteCounts((prev) => ({ ...prev, [row.video_id]: Math.max(0, (prev[row.video_id] || 1) - 1) }));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "video_comments" }, (payload: any) => {
        const row = payload.new;
        if (!row || row.user_id === user?.id) return;
        setCommentsByVideo((prev) => ({ ...prev, [row.video_id]: [row, ...(prev[row.video_id] || [])] }));
        if (row.user_id && !nameLookup[row.user_id]) {
          void fetchNamesForUsers([row.user_id]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

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

  const handleAccurate = async (videoId: string) => {
    if (!user) { toast.error("Sign in first"); return; }
    const current = interactions[videoId];
    const newVal = !(current?.accurate);
    
    await supabase.from("buzz_interactions").upsert(
      { user_id: user.id, video_id: videoId, accurate: newVal, checked: current?.checked || false },
      { onConflict: "user_id,video_id" }
    );
    
    setInteractions((prev) => ({ ...prev, [videoId]: { ...prev[videoId], accurate: newVal, checked: prev[videoId]?.checked || false } }));
    setAccurateCounts((prev) => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 0) + (newVal ? 1 : -1)) }));
  };

  const handleCheck = async (videoId: string) => {
    if (!user) { toast.error("Sign in first"); return; }
    const current = interactions[videoId];
    const newVal = !(current?.checked);
    
    await supabase.from("buzz_interactions").upsert(
      { user_id: user.id, video_id: videoId, checked: newVal, accurate: current?.accurate || false },
      { onConflict: "user_id,video_id" }
    );
    
    setInteractions((prev) => ({ ...prev, [videoId]: { ...prev[videoId], checked: newVal, accurate: prev[videoId]?.accurate || false } }));
    setCheckCounts((prev) => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 0) + (newVal ? 1 : -1)) }));
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

        <div ref={containerRef} className="snap-y snap-mandatory">
          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center snap-start">
              <Play className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No videos yet. Be the first to post!</p>
            </div>
          )}
          {videos.map((video: any, idx: number) => (
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
                onShare={() => setShareVideo(video)}
                onComment={handleCommentSubmit}
                onDeleteComment={handleDeleteComment}
                onFlag={handleFlagVideo}
                onUnflag={handleUnflagVideo}
                onDelete={handleDeleteVideo}
                onOpenFullscreen={() => setFullscreenIndex(idx)}
                isVisible={visibleVideoId === video.id}
                accurateCount={accurateCounts[video.id] || 0}
                isAccurate={interactions[video.id]?.accurate || false}
                checkCount={checkCounts[video.id] || 0}
                isChecked={interactions[video.id]?.checked || false}
                onAccurate={handleAccurate}
                onCheck={handleCheck}
              />
            </div>
          ))}
        </div>

        {user && <BuzzUploadModal open={showUpload} onClose={() => setShowUpload(false)} onUploaded={() => fetchVideosAndComments()} userId={user.id} />}
      </div>

      {fullscreenIndex !== null && (
        <FullscreenReel
          videos={videos}
          startIndex={fullscreenIndex}
          isLiked={(id) => userVotes.has(id)}
          isBookmarked={(id) => userBookmarks.has(id)}
          likeCount={(id) => voteCounts[id] || 0}
          commentCount={(id) => (commentsByVideo[id] || []).length}
          accurateCount={(id) => accurateCounts[id] || 0}
          checkCount={(id) => checkCounts[id] || 0}
          isAccurate={(id) => interactions[id]?.accurate || false}
          isChecked={(id) => interactions[id]?.checked || false}
          nameLookup={nameLookup}
          comments={(id) => commentsByVideo[id] || []}
          userId={user?.id}
          isAdmin={isAdmin}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onShare={(v) => setShareVideo(v)}
          onComment={handleCommentSubmit}
          onAccurate={handleAccurate}
          onCheck={handleCheck}
          onClose={() => setFullscreenIndex(null)}
        />
      )}

      <ShareModal open={!!shareVideo} onClose={() => setShareVideo(null)} video={shareVideo} />
    </AppLayout>
  );
};

export default Buzz;
