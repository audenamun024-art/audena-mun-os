import { useRef, useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Bookmark, MoreVertical, ThumbsDown, Eye, Trash2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import sendIconImg from "@/assets/send-icon.jpg";

type Props = {
  video: any;
  nameLookup: Record<string, string>;
  comments: any[];
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  userId?: string;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (video: any) => void;
  onComment: (videoId: string, content: string) => void;
  onDeleteComment: (commentId: string, videoId: string) => void;
  onFlag: (id: string) => void;
  onUnflag: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFullscreen?: (video: any) => void;
  isVisible?: boolean;
};

const BuzzVideoCard = ({
  video, nameLookup, comments, likeCount, isLiked, isBookmarked,
  isAdmin, isOwner, userId, onLike, onBookmark, onShare, onComment,
  onDeleteComment, onFlag, onUnflag, onDelete, onOpenFullscreen, isVisible,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTime = useRef(0);
  const canDelete = isAdmin || isOwner;
  const toRender = showComments ? comments : comments.slice(0, 2);

  // Auto-play when visible
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isVisible) {
      el.play().catch(() => {});
      setIsPaused(false);
    } else {
      el.pause();
    }
  }, [isVisible]);

  // Double-tap to like, single-tap to fullscreen
  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    const timeSince = now - lastTapTime.current;
    lastTapTime.current = now;

    if (timeSince < 300) {
      if (!isLiked) onLike(video.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    } else {
      setTimeout(() => {
        if (Date.now() - lastTapTime.current >= 280) {
          if (onOpenFullscreen) onOpenFullscreen(video);
        }
      }, 300);
    }
  }, [isLiked, onLike, video, onOpenFullscreen]);

  // Long press to pause
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      videoRef.current?.pause();
      setIsPaused(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isPaused) {
      videoRef.current?.play().catch(() => {});
      setIsPaused(false);
    }
  };

  return (
    <article className={`bg-card border-b border-border overflow-hidden ${video.flagged ? "border-destructive/30" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-background">
          <span className="text-primary-foreground text-[11px] font-bold">
            {(nameLookup[video.user_id] || "M").slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground truncate">{nameLookup[video.user_id] || "MUN Delegate"}</p>
          <p className="text-[11px] text-muted-foreground">{video.category || "Buzz"}</p>
        </div>
        {video.flagged && <span className="text-[9px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold">FLAGGED</span>}
        {canDelete && (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary">
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-elevated z-20 w-40 overflow-hidden">
                {isAdmin && !video.flagged && (
                  <button onClick={() => { onFlag(video.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary text-warning flex items-center gap-2">
                    <ThumbsDown className="h-3 w-3" /> Flag
                  </button>
                )}
                {isAdmin && video.flagged && (
                  <button onClick={() => { onUnflag(video.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-secondary text-success flex items-center gap-2">
                    <Eye className="h-3 w-3" /> Unflag
                  </button>
                )}
                <button onClick={() => { onDelete(video.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-destructive/5 text-destructive flex items-center gap-2">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video — Instagram Reel style, responsive */}
      <div
        className="relative bg-black w-full aspect-[9/16] sm:aspect-[9/16] max-h-[80vh] overflow-hidden cursor-pointer select-none"
        onClick={handleVideoTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        {video.video_url ? (
          <video
            ref={videoRef}
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src={video.video_url} />
          </video>
        ) : (
          <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
        )}

        {/* Double-tap heart animation */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="h-24 w-24 text-destructive fill-current animate-scale-in opacity-90" />
          </div>
        )}

        {/* Paused indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-8 bg-white rounded" />
                <div className="w-2 h-8 bg-white rounded" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-5 mb-2">
          <button onClick={() => onLike(video.id)} className={`transition-transform active:scale-125 ${isLiked ? "text-destructive" : "text-foreground"}`}>
            <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="text-foreground hover:text-muted-foreground">
            <MessageCircle className="h-6 w-6" />
          </button>
          <button onClick={() => onShare(video)} className="text-foreground hover:text-muted-foreground">
            <Send className="h-6 w-6" />
          </button>
          <button onClick={() => onBookmark(video.id)} className={`ml-auto ${isBookmarked ? "text-foreground" : "text-foreground hover:text-muted-foreground"}`}>
            <Bookmark className={`h-6 w-6 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>

        {likeCount > 0 && <p className="text-[13px] font-semibold text-foreground mb-1">{likeCount} likes</p>}

        <p className="text-[13px] text-foreground leading-snug mb-1">
          <span className="font-semibold mr-1.5">{nameLookup[video.user_id] || "Delegate"}</span>
          {video.title}
        </p>

        {/* Comments */}
        <div className="mt-1 space-y-1">
          {comments.length > 2 && !showComments && (
            <button onClick={() => setShowComments(true)} className="text-[13px] text-muted-foreground">
              View all {comments.length} comments
            </button>
          )}
          {toRender.map((c: any) => (
            <div key={c.id} className="flex items-start gap-1 group">
              <p className="text-[13px] text-foreground leading-snug flex-1">
                <span className="font-semibold mr-1.5">{nameLookup[c.user_id] || "Delegate"}</span>{c.content}
              </p>
              {(isAdmin || c.user_id === userId) && (
                <button onClick={() => onDeleteComment(c.id, video.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          {showComments && (
            <div className="flex items-center gap-2 pt-2">
              <Input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Add a comment..."
                className="h-9 bg-transparent border-0 border-b border-border rounded-none text-[13px] focus-visible:ring-0 px-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentDraft.trim()) {
                    onComment(video.id, commentDraft.trim());
                    setCommentDraft("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (commentDraft.trim()) {
                    onComment(video.id, commentDraft.trim());
                    setCommentDraft("");
                  }
                }}
                disabled={!commentDraft.trim()}
                className="disabled:opacity-30 shrink-0"
              >
                <img src={sendIconImg} alt="Send" className="h-7 w-7 rounded-full object-cover" />
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
};

export default BuzzVideoCard;
