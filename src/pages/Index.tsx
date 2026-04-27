import AppLayout from "@/components/layout/AppLayout";
import { Play, Plus, TrendingUp, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import BuzzVideoCard from "@/components/buzz/BuzzVideoCard";
import FullscreenReel from "@/components/buzz/FullscreenReel";
import ShareModal from "@/components/buzz/ShareModal";

type CommentsByVideo = Record<string, any[]>;
type NameLookup = Record<string, string>;
type InteractionState = Record<string, { accurate: boolean; checked: boolean }>;

const Index = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [topDelegates, setTopDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [commentsByVideo, setCommentsByVideo] = useState<CommentsByVideo>({});
  const [nameLookup, setNameLookup] = useState<NameLookup>({});
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [shareVideo, setShareVideo] = useState<any>(null);
  const [interactions, setInteractions] = useState<InteractionState>({});
  const [accurateCounts, setAccurateCounts] = useState<Record<string, number>>({});
  const [checkCounts, setCheckCounts] = useState<Record<string, number>>({});
  const feedRef = useRef<HTMLDivElement>(null);
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

  const fetchVideos = useCallback(async () => {
    const { data: videoRows } = await supabase.from("videos").select("*").eq("flagged", false).order("created_at", { ascending: false }).limit(20);
    const currentVideos = videoRows || [];
    setVideos(currentVideos);

    const videoIds = currentVideos.map((v: any) => v.id);
    if (videoIds.length > 0) {
      const [{ data: commentRows }, { data: allVotes }, { data: allInteractions }] = await Promise.all([
        supabase.from("video_comments").select("*").in("video_id", videoIds).order("created_at", { ascending: false }),
        supabase.from("votes").select("video_id").in("video_id", videoIds),
        supabase.from("buzz_interactions").select("*").in("video_id", videoIds),
      ]);

      const counts: Record<string, number> = {};
      (allVotes || []).forEach((v: any) => { counts[v.video_id] = (counts[v.video_id] || 0) + 1; });
      setVoteCounts(counts);

      const ac: Record<string, number> = {};
      const cc: Record<string, number> = {};
      (allInteractions || []).forEach((i: any) => {
        if (i.accurate) ac[i.video_id] = (ac[i.video_id] || 0) + 1;
        if (i.checked) cc[i.video_id] = (cc[i.video_id] || 0) + 1;
      });
      setAccurateCounts(ac);
      setCheckCounts(cc);

      if (user) {
        const userInts: InteractionState = {};
        (allInteractions || []).forEach((i: any) => {
          if (i.user_id === user.id) userInts[i.video_id] = { accurate: i.accurate, checked: i.checked };
        });
        setInteractions(userInts);
      }

      const grouped: CommentsByVideo = {};
      (commentRows || []).forEach((c: any) => { if (!grouped[c.video_id]) grouped[c.video_id] = []; grouped[c.video_id].push(c); });
      setCommentsByVideo(grouped);

      const involvedUserIds = new Set<string>();
      currentVideos.forEach((v: any) => v.user_id && involvedUserIds.add(v.user_id));
      (commentRows || []).forEach((c: any) => c.user_id && involvedUserIds.add(c.user_id));
      await fetchNamesForUsers([...involvedUserIds]);
    }
  }, [user]);

  useEffect(() => {
    const bootstrap = async () => {
      const [topData] = await Promise.all([
        supabase.from("profiles").select("*").order("rank_points", { ascending: false }).limit(5),
      ]);
      setTopDelegates(topData.data || []);

      if (user) {
        const [{ data: votes }, { data: bookmarks }] = await Promise.all([
          supabase.from("votes").select("video_id").eq("user_id", user.id),
          supabase.from("video_bookmarks").select("video_id").eq("user_id", user.id),
        ]);
        if (votes) setUserVotes(new Set((votes as any[]).map((v) => v.video_id)));
        if (bookmarks) setUserBookmarks(new Set((bookmarks as any[]).map((b) => b.video_id)));
      }
      await fetchVideos();
      setLoading(false);
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
    } else {
      await supabase.from("video_bookmarks").insert([{ user_id: user.id, video_id: videoId }]);
      setUserBookmarks((prev) => new Set(prev).add(videoId));
      toast.success("Saved");
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
    setInteractions((prev) => ({ ...prev, [videoId]: { accurate: newVal, checked: prev[videoId]?.checked || false } }));
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
    setInteractions((prev) => ({ ...prev, [videoId]: { checked: newVal, accurate: prev[videoId]?.accurate || false } }));
    setCheckCounts((prev) => ({ ...prev, [videoId]: Math.max(0, (prev[videoId] || 0) + (newVal ? 1 : -1)) }));
  };

  const handleCommentSubmit = async (videoId: string, content: string) => {
    if (!user) { toast.error("Sign in to comment"); return; }
    const { data, error } = await supabase.from("video_comments").insert([{ video_id: videoId, user_id: user.id, content }]).select("*").single();
    if (error) { toast.error(error.message); return; }
    setCommentsByVideo((prev) => ({ ...prev, [videoId]: [data, ...(prev[videoId] || [])] }));
  };

  const handleDeleteComment = async (commentId: string, videoId: string) => {
    await supabase.from("video_comments").delete().eq("id", commentId);
    setCommentsByVideo((prev) => ({ ...prev, [videoId]: (prev[videoId] || []).filter((c: any) => c.id !== commentId) }));
  };

  const displayDelegates = topDelegates.length > 0 ? topDelegates : [
    { full_name: "Arjun Mehta", institution: "St. Xavier's", rank_points: 340 },
    { full_name: "Priya Sharma", institution: "Lady Shri Ram", rank_points: 290 },
    { full_name: "Rohan Kapoor", institution: "Hindu College", rank_points: 270 },
  ];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0 lg:gap-6">
          {/* Main Feed */}
          <div className="max-w-xl mx-auto w-full">
            <div ref={feedRef}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="w-full aspect-[9/16] max-h-[60vh] rounded-lg" />
                  </div>
                ))
              ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">No posts yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">Be the first to share a speech or debate moment.</p>
                  {user && (
                    <Link to="/buzz">
                      <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Create Post</Button>
                    </Link>
                  )}
                </div>
              ) : (
                videos.map((video: any, idx: number) => (
                  <div
                    key={video.id}
                    data-video-id={video.id}
                    ref={(el) => { if (el) videoRefs.current.set(video.id, el); else videoRefs.current.delete(video.id); }}
                  >
                    <BuzzVideoCard
                      video={video}
                      nameLookup={nameLookup}
                      comments={commentsByVideo[video.id] || []}
                      likeCount={voteCounts[video.id] || 0}
                      isLiked={userVotes.has(video.id)}
                      isBookmarked={userBookmarks.has(video.id)}
                      isAdmin={false}
                      isOwner={user?.id === video.user_id}
                      userId={user?.id}
                      onLike={handleLike}
                      onBookmark={handleBookmark}
                      onShare={() => setShareVideo(video)}
                      onComment={handleCommentSubmit}
                      onDeleteComment={handleDeleteComment}
                      onFlag={() => {}}
                      onUnflag={() => {}}
                      onDelete={() => {}}
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
                ))
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-border">
            <div className="p-5 space-y-6">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-bold">
                      {user.user_metadata?.full_name?.slice(0, 2).toUpperCase() || "AU"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user.user_metadata?.full_name || "Delegate"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Join Audena Hub</p>
                  <Link to="/auth">
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold">Sign Up</Button>
                  </Link>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Delegates</p>
                  <Link to="/explore" className="text-xs font-medium text-primary hover:underline">See All</Link>
                </div>
                <div className="space-y-3">
                  {displayDelegates.slice(0, 5).map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {i < 3 ? medals[i] : `${i + 1}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{d.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{d.institution}</p>
                      </div>
                      <span className="text-xs font-bold text-primary">{d.rank_points} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Explore</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Explore", path: "/explore", icon: "🧭" },
                    { label: "Buzz Feed", path: "/buzz", icon: "🎬" },
                    { label: "Chats", path: "/chats", icon: "💬" },
                    { label: "Profile", path: "/profile", icon: "👤" },
                  ].map((item) => (
                    <Link key={item.label} to={item.path}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary text-[13px] font-medium text-foreground transition-colors">
                      <span>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">Audena Hub · India's Premier MUN Platform</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">© 2026 Audena Hub. All rights reserved.</p>
              </div>
            </div>
          </aside>
        </div>
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
          isAdmin={false}
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

export default Index;
