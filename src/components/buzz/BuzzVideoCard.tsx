import { useRef, useEffect, useState, useCallback } from "react";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Flag, Trash2, CheckCheck, CheckCircle2, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import sendIcon from "@/assets/send-icon.jpg";

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
  onOpenFullscreen: (video: any) => void;
  isVisible: boolean;
  accurateCount?: number;
  isAccurate?: boolean;
  checkCount?: number;
  isChecked?: boolean;
  onAccurate?: (id: string) => void;
  onCheck?: (id: string) => void;
};

const BuzzVideoCard = ({
  video, nameLookup, comments, likeCount, isLiked, isBookmarked,
  isAdmin, isOwner, userId, onLike, onBookmark, onShare, onComment,
  onDeleteComment, onFlag, onUnflag, onDelete, onOpenFullscreen, isVisible,
  accurateCount = 0, isAccurate = false, checkCount = 0, isChecked = false,
  onAccurate, onCheck,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isVisible) { videoRef.current.play().catch(() => {}); }
    else { videoRef.current.pause(); }
  }, [isVisible]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (singleTapTimer.current) clearTimeout(singleTapTimer.current);
    if (now - lastTapTime.current < 300) {
      if (!isLiked) onLike(video.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
      lastTapTime.current = 0;
    } else {
      lastTapTime.current = now;
      singleTapTimer.current = setTimeout(() => {
        onOpenFullscreen(video);
      }, 300);
    }
  }, [isLiked, onLike, video, onOpenFullscreen]);

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

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onComment(video.id, commentText.trim());
      setCommentText("");
    }
  };

  return (
    <div className="bg-card border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">
              {(nameLookup[video.user_id] || "D")[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{nameLookup[video.user_id] || "Delegate"}</p>
            <p className="text-[10px] text-muted-foreground">{video.category || "Buzz"}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground p-1">
            <MoreHorizontal className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin && !video.flagged && <DropdownMenuItem onClick={() => onFlag(video.id)}><Flag className="h-4 w-4 mr-2" />Flag</DropdownMenuItem>}
            {isAdmin && video.flagged && <DropdownMenuItem onClick={() => onUnflag(video.id)}><Flag className="h-4 w-4 mr-2" />Unflag</DropdownMenuItem>}
            {(isAdmin || isOwner) && <DropdownMenuItem onClick={() => onDelete(video.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Video */}
      <div
        className="relative w-full aspect-[9/16] max-h-[75vh] bg-black overflow-hidden cursor-pointer"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <video ref={videoRef} loop playsInline muted={!isVisible} preload="metadata" className="w-full h-full object-cover">
          <source src={video.video_url} />
        </video>

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="h-24 w-24 text-destructive fill-current animate-scale-in" />
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-7 bg-white rounded" />
                <div className="w-2 h-7 bg-white rounded" />
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-sm font-medium">{video.title}</p>
          {video.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{video.description}</p>}
        </div>
      </div>

      {/* Interactions */}
      <div className="px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={() => onLike(video.id)} className="flex items-center gap-1.5 group">
              <Heart className={`h-6 w-6 transition-all group-active:scale-125 ${isLiked ? "text-destructive fill-current" : "text-foreground"}`} />
              <span className="text-xs font-semibold text-foreground">{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 group">
              <MessageCircle className="h-6 w-6 text-foreground group-active:scale-110 transition-all" />
              <span className="text-xs font-semibold text-foreground">{comments.length}</span>
            </button>
            <button onClick={() => onAccurate?.(video.id)} className="flex items-center gap-1.5 group">
              <CheckCheck className={`h-6 w-6 transition-all group-active:scale-110 ${isAccurate ? "text-primary" : "text-foreground"}`} />
              <span className="text-xs font-semibold text-foreground">{accurateCount}</span>
            </button>
            <button onClick={() => onCheck?.(video.id)} className="flex items-center gap-1.5 group">
              <CheckCircle2 className={`h-6 w-6 transition-all group-active:scale-110 ${isChecked ? "text-green-500 fill-current" : "text-foreground"}`} />
              <span className="text-xs font-semibold text-foreground">{checkCount}</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onShare(video)} className="text-foreground active:scale-110 transition-all">
              <Paperclip className="h-5 w-5" />
            </button>
            <button onClick={() => onBookmark(video.id)} className="active:scale-110 transition-all">
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "text-primary fill-current" : "text-foreground"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-3 space-y-2 border-t border-border pt-2">
          {comments.slice(0, 4).map((c: any) => (
            <div key={c.id} className="flex items-start gap-2">
              <p className="text-xs flex-1">
                <span className="font-semibold text-foreground">{nameLookup[c.user_id] || "User"}</span>{" "}
                <span className="text-muted-foreground">{c.content}</span>
              </p>
              {(userId === c.user_id || isAdmin) && (
                <button onClick={() => onDeleteComment(c.id, video.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="h-9 text-xs bg-secondary border-border rounded-full flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            />
            <button onClick={handleSubmitComment} className="shrink-0">
              <img src={sendIcon} alt="Send" className="h-5 w-5 rounded-full object-cover" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuzzVideoCard;
