import { useRef, useEffect, useState, useCallback } from "react";
import { X, Heart, MessageCircle, Bookmark, Send } from "lucide-react";

type Props = {
  video: any;
  isLiked: boolean;
  isBookmarked: boolean;
  likeCount: number;
  nameLookup: Record<string, string>;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (video: any) => void;
  onClose: () => void;
};

const FullscreenReel = ({ video, isLiked, isBookmarked, likeCount, nameLookup, onLike, onBookmark, onShare, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const lastTapTime = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      if (!isLiked) onLike(video.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTapTime.current = now;
  }, [isLiked, onLike, video.id]);

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
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2 rounded-full bg-black/30">
        <X className="h-6 w-6" />
      </button>

      {/* Video */}
      <div
        className="flex-1 relative"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        <video ref={videoRef} loop playsInline className="w-full h-full object-cover">
          <source src={video.video_url} />
        </video>

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <Heart className="h-28 w-28 text-destructive fill-current animate-scale-in" />
          </div>
        )}

        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-8 bg-white rounded" />
                <div className="w-2 h-8 bg-white rounded" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-semibold text-sm">{nameLookup[video.user_id] || "Delegate"}</p>
          <p className="text-white/80 text-xs mt-1">{video.title}</p>
        </div>

        {/* Right actions */}
        <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5">
          <button onClick={(e) => { e.stopPropagation(); onLike(video.id); }} className="flex flex-col items-center gap-1">
            <Heart className={`h-7 w-7 ${isLiked ? "text-destructive fill-current" : "text-white"}`} />
            <span className="text-white text-[10px] font-semibold">{likeCount}</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onShare(video); }} className="flex flex-col items-center gap-1">
            <Send className="h-7 w-7 text-white" />
            <span className="text-white text-[10px]">Share</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onBookmark(video.id); }} className="flex flex-col items-center gap-1">
            <Bookmark className={`h-7 w-7 ${isBookmarked ? "text-white fill-current" : "text-white"}`} />
            <span className="text-white text-[10px]">Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenReel;
