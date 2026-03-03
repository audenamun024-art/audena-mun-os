import AppLayout from "@/components/layout/AppLayout";
import { Heart, Play, Share2, Plus, Bookmark, MessageCircle, Send, MessageSquareMore } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import buzzImg from "@/assets/buzz-placeholder.jpg";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import BuzzUploadModal from "@/components/buzz/BuzzUploadModal";

const categories = ["All", "Best Speech", "Crisis Reaction", "Debate Moment", "Award"];

type CommentsByVideo = Record<string, any[]>;

type NameLookup = Record<string, string>;

const Buzz = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
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
      data.forEach((row: any) => {
        if (row.user_id) next[row.user_id] = row.full_name || "Delegate";
      });
      return next;
    });
  };

  const fetchVideosAndComments = async () => {
    let query = supabase.from("videos").select("*").eq("flagged", false).order("created_at", { ascending: false });

    if (activeCategory !== "All") {
      query = query.eq("category", activeCategory);
    }

    const { data: videoRows, error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }

    const currentVideos = videoRows || [];
    setVideos(currentVideos);

    const videoIds = currentVideos.map((video: any) => video.id);
    if (videoIds.length === 0) {
      setCommentsByVideo({});
      return;
    }

    const { data: commentRows } = await supabase
      .from("video_comments")
      .select("*")
      .in("video_id", videoIds)
      .order("created_at", { ascending: false });

    const grouped: CommentsByVideo = {};
    (commentRows || []).forEach((comment: any) => {
      if (!grouped[comment.video_id]) grouped[comment.video_id] = [];
      grouped[comment.video_id].push(comment);
    });

    setCommentsByVideo(grouped);

    const involvedUserIds = new Set<string>();
    currentVideos.forEach((video: any) => video.user_id && involvedUserIds.add(video.user_id));
    (commentRows || []).forEach((comment: any) => comment.user_id && involvedUserIds.add(comment.user_id));
    await fetchNamesForUsers([...involvedUserIds]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const activeUser = authData.user;
      setUser(activeUser);

      if (activeUser) {
        const [{ data: votes }, { data: bookmarks }, { data: selfProfile }] = await Promise.all([
          supabase.from("votes").select("target_id").eq("user_id", activeUser.id).eq("target_type", "video"),
          supabase.from("video_bookmarks").select("video_id").eq("user_id", activeUser.id),
          supabase.from("profiles").select("full_name").eq("user_id", activeUser.id).maybeSingle(),
        ]);

        if (votes) setUserVotes(new Set(votes.map((vote: any) => vote.target_id)));
        if (bookmarks) setUserBookmarks(new Set(bookmarks.map((bookmark: any) => bookmark.video_id)));
        if (selfProfile?.full_name) {
          setNameLookup((prev) => ({ ...prev, [activeUser.id]: selfProfile.full_name }));
        }
      }

      await fetchVideosAndComments();
    };

    bootstrap();
  }, []);

  useEffect(() => {
    fetchVideosAndComments();
  }, [activeCategory]);

  const handleLike = async (videoId: string) => {
    if (!user) {
      toast.error("Sign in to like videos");
      return;
    }

    const liked = userVotes.has(videoId);

    if (liked) {
      await supabase.from("votes").delete().eq("user_id", user.id).eq("target_id", videoId).eq("target_type", "video");
      setUserVotes((prev) => {
        const copy = new Set(prev);
        copy.delete(videoId);
        return copy;
      });
      setVideos((prev) => prev.map((video: any) => (video.id === videoId ? { ...video, likes: Math.max(0, (video.likes || 1) - 1) } : video)));
      return;
    }

    const { error } = await supabase.from("votes").insert({ user_id: user.id, target_id: videoId, target_type: "video" });
    if (error) {
      toast.error(error.message);
      return;
    }

    setUserVotes((prev) => new Set(prev).add(videoId));
    setVideos((prev) => prev.map((video: any) => (video.id === videoId ? { ...video, likes: (video.likes || 0) + 1 } : video)));
  };

  const handleBookmark = async (videoId: string) => {
    if (!user) {
      toast.error("Sign in to save videos");
      return;
    }

    const alreadySaved = userBookmarks.has(videoId);
    if (alreadySaved) {
      const { error } = await supabase.from("video_bookmarks").delete().eq("user_id", user.id).eq("video_id", videoId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setUserBookmarks((prev) => {
        const copy = new Set(prev);
        copy.delete(videoId);
        return copy;
      });
      toast.success("Removed from saved");
      return;
    }

    const { error } = await supabase.from("video_bookmarks").insert({ user_id: user.id, video_id: videoId });
    if (error) {
      toast.error(error.message);
      return;
    }

    setUserBookmarks((prev) => new Set(prev).add(videoId));
    toast.success("Saved to your bookmarks");
  };

  const handleCommentSubmit = async (videoId: string) => {
    const payload = commentDraft.trim();
    if (!payload) return;

    if (!user) {
      toast.error("Sign in to comment");
      return;
    }

    const { data, error } = await supabase
      .from("video_comments")
      .insert({
        video_id: videoId,
        user_id: user.id,
        comment: payload,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    setCommentsByVideo((prev) => ({
      ...prev,
      [videoId]: [data, ...(prev[videoId] || [])],
    }));
    setCommentDraft("");
    toast.success("Comment posted");
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/buzz?video=${video.id}`;
    const shareTitle = `${video.title} • AudenaMUN Buzz`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Video link copied");
      }
    } catch {
      toast.info("Share cancelled");
    }
  };

  const handleUpload = () => {
    if (!user) {
      toast.error("Please sign in to upload");
      return;
    }
    setShowUpload(true);
  };

  const currentComments = useMemo(() => {
    if (!activeCommentsVideoId) return [];
    return commentsByVideo[activeCommentsVideoId] || [];
  }, [activeCommentsVideoId, commentsByVideo]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">Buzz</h1>
            <p className="text-xs text-muted-foreground">MUN reels, speeches, crisis moments</p>
          </div>
          <Button size="sm" className="bg-accent text-accent-foreground hover:opacity-90 h-8 text-xs" onClick={handleUpload}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create
          </Button>
        </div>

        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-5 pb-6">
          {videos.length === 0 && (
            <div className="text-center py-12">
              <Play className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No videos yet. Be the first to post on Buzz!</p>
            </div>
          )}

          {videos.map((video: any) => {
            const comments = commentsByVideo[video.id] || [];
            const showAllComments = activeCommentsVideoId === video.id;
            const commentsToRender = showAllComments ? comments : comments.slice(0, 2);

            return (
              <article key={video.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent text-xs font-semibold">
                      {(nameLookup[video.user_id] || "M").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{nameLookup[video.user_id] || "MUN Delegate"}</p>
                    <p className="text-[10px] text-muted-foreground">{video.category}</p>
                  </div>
                </div>

                <AspectRatio ratio={9 / 16} className="bg-secondary">
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
                    <img src={video.thumbnail_url || buzzImg} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </AspectRatio>

                <div className="p-3.5 space-y-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(video.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        userVotes.has(video.id) ? "text-destructive" : "text-foreground hover:text-destructive"
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${userVotes.has(video.id) ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={() => setActiveCommentsVideoId((prev) => (prev === video.id ? null : video.id))}
                      className="text-foreground hover:text-accent transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleShare(video)} className="text-foreground hover:text-accent transition-colors">
                      <Share2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleBookmark(video.id)}
                      className={`ml-auto transition-colors ${
                        userBookmarks.has(video.id) ? "text-accent" : "text-foreground hover:text-accent"
                      }`}
                    >
                      <Bookmark className={`h-5 w-5 ${userBookmarks.has(video.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground">{video.likes || 0} likes</p>
                    <p className="text-xs text-foreground mt-1 leading-relaxed">{video.title}</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveCommentsVideoId((prev) => (prev === video.id ? null : video.id))}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <MessageSquareMore className="h-3.5 w-3.5" />
                      {comments.length > 0 ? `View comments (${comments.length})` : "Be the first to comment"}
                    </button>

                    {commentsToRender.map((comment: any) => (
                      <p key={comment.id} className="text-xs text-foreground leading-relaxed">
                        <span className="font-semibold mr-1">{nameLookup[comment.user_id] || "Delegate"}</span>
                        {comment.comment}
                      </p>
                    ))}

                    {showAllComments && (
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          value={activeCommentsVideoId === video.id ? commentDraft : ""}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Add a diplomatic comment..."
                          className="h-9 bg-secondary border-border text-xs"
                        />
                        <Button
                          size="sm"
                          className="h-9 bg-accent text-accent-foreground"
                          onClick={() => handleCommentSubmit(video.id)}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {activeCommentsVideoId && currentComments.length === 0 && (
          <div className="px-4 pb-6">
            <p className="text-xs text-muted-foreground">No comments yet on this reel.</p>
          </div>
        )}

        {user && (
          <BuzzUploadModal
            open={showUpload}
            onClose={() => setShowUpload(false)}
            onUploaded={() => fetchVideosAndComments()}
            userId={user.id}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Buzz;

