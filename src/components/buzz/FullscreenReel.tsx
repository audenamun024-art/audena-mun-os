import { useRef, useEffect, useState, useCallback } from "react";
import { X, Heart, MessageCircle, Bookmark, Paperclip, CheckCheck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  videos: any[];
  startIndex: number;
  isLiked: (id: string) => boolean;
  isBookmarked: (id: string) => boolean;
  likeCount: (id: string) => number;
  commentCount: (id: string) => number;
  accurateCount: (id: string) => number;
  checkCount: (id: string) => number;
  isAccurate: (id: string) => boolean;
  isChecked: (id: string) => boolean;
  nameLookup: Record<string, string>;
  comments: (id: string) => any[];
  userId?: string;
  isAdmin: boolean;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (video: any) => void;
  onComment: (videoId: string, content: string) => void;
  onAccurate: (id: string) => void;
  onCheck: (id: string) => void;
  onClose: () => void;
};

const FullscreenReel = ({
  videos, startIndex, isLiked, isBookmarked, likeCount, commentCount,
  accurateCount, checkCount, isAccurate, isChecked,
  nameLookup, comments, userId, isAdmin, onLike, onBookmark, onShare, onComment, onAccurate, onCheck, onClose,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [showHeart, setShowHeart] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // Scroll to start video
    setTimeout(() => {
      containerRef.current?.children[startIndex]?.scrollIntoView({ behavior: "auto" });
    }, 50);
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-idx"));
          const vid = videoRefs.current.get(videos[idx]?.id);
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            setActiveIndex(idx);
            vid?.play().catch(() => {});
          } else {
            vid?.pause();
          }
        });
      },
      { threshold: [0.7], root: containerRef.current }
    );

    containerRef.current?.querySelectorAll("[data-idx]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [videos]);

  const activeVideo = videos[activeIndex];

  const handleTap = useCallback((videoId: string) => {
    const now = Date.now();
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);

    if (now - lastTapTime.current < 300) {
      // Double tap = like
      if (!isLiked(videoId)) onLike(videoId);
      setShowHeart(videoId);
      setTimeout(() => setShowHeart(null), 800);
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      singleTapTimer.current = setTimeout(() => {
        // Single tap = toggle pause
        const vid = videoRefs.current.get(videoId);
        if (vid) {
          if (vid.paused) { vid.play().catch(() => {}); setIsPaused(false); }
          else { vid.pause(); setIsPaused(true); }
        }
      }, 300);
    }
  }, [isLiked, onLike]);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      const vid = videoRefs.current.get(activeVideo?.id);
      vid?.pause();
      setIsPaused(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isPaused) {
      videoRefs.current.get(activeVideo?.id)?.play().catch(() => {});
      setIsPaused(false);
    }
  };

  const handleSubmitComment = () => {
    if (commentText.trim() && activeVideo) {
      onComment(activeVideo.id, commentText.trim());
      setCommentText("");
    }
  };

  const activeComments = activeVideo ? comments(activeVideo.id) : [];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 left-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-black/40">
        <X className="h-6 w-6" />
      </button>

      {/* Scrollable reels container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as any}
      >
        {videos.map((video, idx) => (
          <div
            key={video.id}
            data-idx={idx}
            className="h-[100dvh] w-full snap-start relative flex items-center justify-center"
          >
            <video
              ref={(el) => { if (el) videoRefs.current.set(video.id, el); }}
              loop
              playsInline
              muted={idx !== activeIndex}
              preload="metadata"
              className="w-full h-full object-cover"
              onClick={() => handleTap(video.id)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <source src={video.video_url} />
            </video>

            {/* Heart animation */}
            {showHeart === video.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Heart className="h-28 w-28 text-destructive fill-current animate-scale-in" />
              </div>
            )}

            {/* Pause indicator */}
            {isPaused && activeIndex === idx && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-8 bg-white rounded" />
                    <div className="w-2.5 h-8 bg-white rounded" />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <p className="text-white font-semibold text-sm">{nameLookup[video.user_id] || "Delegate"}</p>
              <p className="text-white/80 text-xs mt-1">{video.title}</p>
              {video.description && <p className="text-white/60 text-[11px] mt-0.5 line-clamp-2">{video.description}</p>}
            </div>

            {/* Right actions */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
              <button onClick={(e) => { e.stopPropagation(); onLike(video.id); }} className="flex flex-col items-center gap-1">
                <Heart className={`h-7 w-7 ${isLiked(video.id) ? "text-destructive fill-current" : "text-white"} transition-all active:scale-125`} />
                <span className="text-white text-[10px] font-semibold">{likeCount(video.id)}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className="flex flex-col items-center gap-1">
                <MessageCircle className="h-7 w-7 text-white" />
                <span className="text-white text-[10px]">{commentCount(video.id)}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onAccurate(video.id); }} className="flex flex-col items-center gap-1">
                <CheckCheck className={`h-7 w-7 transition-all ${isAccurate(video.id) ? "text-primary" : "text-white"}`} />
                <span className="text-white text-[10px]">{accurateCount(video.id)}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onCheck(video.id); }} className="flex flex-col items-center gap-1">
                <CheckCircle2 className={`h-7 w-7 transition-all ${isChecked(video.id) ? "text-green-400 fill-current" : "text-white"}`} />
                <span className="text-white text-[10px]">{checkCount(video.id)}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onShare(video); }} className="flex flex-col items-center gap-1">
                <Paperclip className="h-7 w-7 text-white" />
                <span className="text-white text-[10px]">Share</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onBookmark(video.id); }} className="flex flex-col items-center gap-1">
                <Bookmark className={`h-7 w-7 ${isBookmarked(video.id) ? "text-primary fill-current" : "text-white"}`} />
                <span className="text-white text-[10px]">Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comments panel */}
      {showComments && activeVideo && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-card rounded-t-2xl border-t border-border max-h-[50vh] flex flex-col animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Comments</span>
            <button onClick={() => setShowComments(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {activeComments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No comments yet</p>
            )}
            {activeComments.map((c: any) => (
              <div key={c.id} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {(nameLookup[c.user_id] || "U")[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground">{nameLookup[c.user_id] || "User"}</span>
                  <p className="text-xs text-muted-foreground">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 border-t border-border">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 h-9 text-xs rounded-full bg-secondary"
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            />
            <button onClick={handleSubmitComment} className="text-primary font-semibold text-xs">Post</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenReel;
