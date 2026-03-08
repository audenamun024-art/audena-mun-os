import AppLayout from "@/components/layout/AppLayout";
import { Heart, MessageCircle, Share2, Bookmark, Play, Plus, Send, MessageSquareMore, TrendingUp, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import buzzImg from "@/assets/buzz-placeholder.jpg";

type CommentsByVideo = Record<string, any[]>;
type NameLookup = Record<string, string>;

const Index = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [topDelegates, setTopDelegates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [userBookmarks, setUserBookmarks] = useState<Set<string>>(new Set());
  const [commentsByVideo, setCommentsByVideo] = useState<CommentsByVideo>({});
  const [activeCommentsVideoId, setActiveCommentsVideoId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [nameLookup, setNameLookup] = useState<NameLookup>({});
  const [activeCategory, setActiveCategory] = useState("All");
  const feedRef = useRef<HTMLDivElement>(null);

  const categories = ["All", "Best Speech", "Crisis Reaction", "Debate Moment", "Award"];

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
    let query = supabase.from("videos").select("*").eq("flagged", false).order("created_at", { ascending: false }).limit(20);
    if (activeCategory !== "All") query = query.eq("category", activeCategory);
    const { data: videoRows } = await query;
    const currentVideos = videoRows || [];
    setVideos(currentVideos);

    const videoIds = currentVideos.map((v: any) => v.id);
    if (videoIds.length > 0) {
      const { data: commentRows } = await supabase.from("video_comments").select("*").in("video_id", videoIds).order("created_at", { ascending: false });
      const grouped: CommentsByVideo = {};
      (commentRows || []).forEach((c: any) => { if (!grouped[c.video_id]) grouped[c.video_id] = []; grouped[c.video_id].push(c); });
      setCommentsByVideo(grouped);

      const involvedUserIds = new Set<string>();
      currentVideos.forEach((v: any) => v.user_id && involvedUserIds.add(v.user_id));
      (commentRows || []).forEach((c: any) => c.user_id && involvedUserIds.add(c.user_id));
      await fetchNamesForUsers([...involvedUserIds]);
    }
  }, [activeCategory]);

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

  useEffect(() => { fetchVideos(); }, [activeCategory, fetchVideos]);

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
    } else {
      await supabase.from("video_bookmarks").insert([{ user_id: user.id, video_id: videoId }]);
      setUserBookmarks((prev) => new Set(prev).add(videoId));
      toast.success("Saved");
    }
  };

  const handleCommentSubmit = async (videoId: string) => {
    const payload = commentDraft.trim();
    if (!payload || !user) { if (!user) toast.error("Sign in to comment"); return; }
    const { data, error } = await supabase.from("video_comments").insert([{ video_id: videoId, user_id: user.id, content: payload }]).select("*").single();
    if (error) { toast.error(error.message); return; }
    setCommentsByVideo((prev) => ({ ...prev, [videoId]: [data, ...(prev[videoId] || [])] }));
    setCommentDraft("");
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/buzz?video=${video.id}`;
    try {
      if (navigator.share) await navigator.share({ title: video.title, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied"); }
    } catch { /* cancelled */ }
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
          {/* Main Feed — Instagram-style scrollable reels */}
          <div className="max-w-xl mx-auto w-full">
            {/* Stories-style category bar */}
            <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                      activeCategory === cat
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed */}
            <div ref={feedRef} className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="w-full aspect-[4/5] rounded-lg" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))
              ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-5">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">No posts yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Be the first to share a speech, debate moment, or crisis reaction from your MUN conference.
                  </p>
                  {user && (
                    <Link to="/buzz">
                      <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" /> Create Post
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                videos.map((video: any) => {
                  const comments = commentsByVideo[video.id] || [];
                  const showAll = activeCommentsVideoId === video.id;
                  const toRender = showAll ? comments : comments.slice(0, 2);

                  return (
                    <article key={video.id} className="pb-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-background">
                          <span className="text-primary-foreground text-[11px] font-bold">
                            {(nameLookup[video.user_id] || "M").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-foreground truncate">
                            {nameLookup[video.user_id] || "MUN Delegate"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{video.category || "Buzz"}</p>
                        </div>
                      </div>

                      {/* Media */}
                      <div className="bg-secondary aspect-[4/5] relative overflow-hidden">
                        {video.video_url ? (
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            poster={video.thumbnail_url || buzzImg}
                            className="w-full h-full object-cover"
                          >
                            <source src={video.video_url} />
                          </video>
                        ) : (
                          <img
                            src={video.thumbnail_url || buzzImg}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-4 pt-3 pb-1">
                        <div className="flex items-center gap-5 mb-2">
                          <button
                            onClick={() => handleLike(video.id)}
                            className={`transition-transform active:scale-125 ${userVotes.has(video.id) ? "text-destructive" : "text-foreground hover:text-muted-foreground"}`}
                          >
                            <Heart className={`h-6 w-6 ${userVotes.has(video.id) ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={() => setActiveCommentsVideoId((p) => p === video.id ? null : video.id)}
                            className="text-foreground hover:text-muted-foreground transition-colors"
                          >
                            <MessageCircle className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleShare(video)}
                            className="text-foreground hover:text-muted-foreground transition-colors"
                          >
                            <Share2 className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleBookmark(video.id)}
                            className={`ml-auto transition-colors ${userBookmarks.has(video.id) ? "text-foreground" : "text-foreground hover:text-muted-foreground"}`}
                          >
                            <Bookmark className={`h-6 w-6 ${userBookmarks.has(video.id) ? "fill-current" : ""}`} />
                          </button>
                        </div>

                        {/* Caption */}
                        <p className="text-[13px] text-foreground leading-snug mb-1">
                          <span className="font-semibold mr-1.5">{nameLookup[video.user_id] || "Delegate"}</span>
                          {video.title}
                        </p>
                        {video.description && (
                          <p className="text-[13px] text-muted-foreground leading-snug mb-1">{video.description}</p>
                        )}

                        {/* Comments */}
                        <div className="mt-1 space-y-1">
                          {comments.length > 2 && !showAll && (
                            <button
                              onClick={() => setActiveCommentsVideoId(video.id)}
                              className="text-[13px] text-muted-foreground hover:text-foreground"
                            >
                              View all {comments.length} comments
                            </button>
                          )}
                          {toRender.map((c: any) => (
                            <p key={c.id} className="text-[13px] text-foreground leading-snug">
                              <span className="font-semibold mr-1.5">{nameLookup[c.user_id] || "Delegate"}</span>
                              {c.content}
                            </p>
                          ))}
                          {showAll && (
                            <div className="flex items-center gap-2 pt-2 pb-1">
                              <Input
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                placeholder="Add a comment..."
                                className="h-9 bg-transparent border-0 border-b border-border rounded-none text-[13px] focus-visible:ring-0 px-0"
                                onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit(video.id)}
                              />
                              <button
                                onClick={() => handleCommentSubmit(video.id)}
                                disabled={!commentDraft.trim()}
                                className="text-primary font-semibold text-[13px] disabled:opacity-30"
                              >
                                Post
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wide">
                          {video.created_at ? new Date(video.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently"}
                        </p>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* Right sidebar — Desktop only */}
          <aside className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-border">
            <div className="p-5 space-y-6">
              {/* User card */}
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

              {/* Top Delegates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Delegates</p>
                  <Link to="/rankboard" className="text-xs font-medium text-primary hover:underline">See All</Link>
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

              {/* Quick links */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Explore</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Events", path: "/events", icon: "📅" },
                    { label: "Buzz Feed", path: "/buzz", icon: "🎬" },
                    { label: "Research", path: "/research", icon: "🔬" },
                    { label: "Rankings", path: "/rankboard", icon: "🏆" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary text-[13px] font-medium text-foreground transition-colors"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Audena Hub · India's Premier MUN Platform
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">© 2026 Audena Hub. All rights reserved.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
