import AppLayout from "@/components/layout/AppLayout";
import { Heart, Eye, Play, Share2, Plus, Bookmark, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import buzzImg from "@/assets/buzz-placeholder.jpg";

const categories = ["All", "Best Speech", "Crisis Reaction", "Debate Moment", "Award"];

const Buzz = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase.from("votes").select("target_id").eq("user_id", data.user.id).eq("target_type", "video").then(({ data: votes }) => {
          if (votes) setUserVotes(new Set(votes.map(v => v.target_id)));
        });
      }
    });
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      let q = supabase.from("videos").select("*").eq("flagged", false).order("created_at", { ascending: false });
      if (activeCategory !== "All") q = q.eq("category", activeCategory);
      const { data } = await q;
      setVideos(data || []);
    };
    fetchVideos();
  }, [activeCategory]);

  const handleLike = async (videoId: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const liked = userVotes.has(videoId);

    if (liked) {
      await supabase.from("votes").delete().eq("user_id", user.id).eq("target_id", videoId).eq("target_type", "video");
      setUserVotes(prev => { const s = new Set(prev); s.delete(videoId); return s; });
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: Math.max(0, (v.likes || 1) - 1) } : v));
    } else {
      await supabase.from("votes").insert({ user_id: user.id, target_id: videoId, target_type: "video" });
      setUserVotes(prev => new Set(prev).add(videoId));
      setVideos(videos.map(v => v.id === videoId ? { ...v, likes: (v.likes || 0) + 1 } : v));
    }
  };

  const handleUpload = () => {
    if (!user) { toast.error("Please sign in to upload"); return; }
    toast.info("Video upload coming soon!");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">Buzz</h1>
            <p className="text-xs text-muted-foreground">MUN moments that matter</p>
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
                  activeCategory === cat
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-4 pb-4">
          {videos.length === 0 && (
            <div className="text-center py-12">
              <Play className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No videos yet. Be the first to create one!</p>
            </div>
          )}
          {videos.map((video: any) => (
            <div key={video.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center">
                  <span className="text-accent text-[10px] font-bold">AU</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">AudenaMUN Delegate</p>
                  <p className="text-[10px] text-muted-foreground">{video.category}</p>
                </div>
                {video.featured && (
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">Featured</span>
                )}
              </div>

              <div className="relative aspect-[4/5] bg-secondary">
                <img src={video.thumbnail_url || buzzImg} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center backdrop-blur-md border border-foreground/20 cursor-pointer hover:bg-foreground/20 transition-colors">
                    <Play className="h-7 w-7 text-foreground ml-1" />
                  </div>
                </div>
              </div>

              <div className="p-3.5">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => handleLike(video.id)}
                    className={`flex items-center gap-1.5 transition-colors ${userVotes.has(video.id) ? "text-red-500" : "text-foreground hover:text-red-500"}`}
                  >
                    <Heart className={`h-5 w-5 ${userVotes.has(video.id) ? "fill-current" : ""}`} />
                  </button>
                  <button className="text-foreground hover:text-accent transition-colors">
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  <button className="text-foreground hover:text-accent transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="ml-auto text-foreground hover:text-accent transition-colors">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs font-semibold text-foreground">{video.likes || 0} likes</p>
                <p className="text-xs text-foreground mt-1">{video.title}</p>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span className="text-[10px]">{video.views || 0} views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Buzz;
