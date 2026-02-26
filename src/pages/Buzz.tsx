import AppLayout from "@/components/layout/AppLayout";
import { Heart, Eye, Play, Share2, Plus, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import buzzImg from "@/assets/buzz-placeholder.jpg";

const categories = ["All", "Best Speech", "Crisis Reaction", "Debate Moment", "Award"];

const mockVideos = [
  { id: "1", title: "Powerful Opening Statement – UNSC", user_id: "", category: "Best Speech", views: 1240, likes: 89, featured: true },
  { id: "2", title: "Crisis Response: Nuclear Threat", user_id: "", category: "Crisis Reaction", views: 980, likes: 67, featured: false },
  { id: "3", title: "Heated Debate on Climate Policy", user_id: "", category: "Debate Moment", views: 756, likes: 45, featured: false },
  { id: "4", title: "Best Delegate Award Speech", user_id: "", category: "Award", views: 2100, likes: 156, featured: true },
];

const Buzz = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const fetchVideos = async () => {
      let q = supabase.from("videos").select("*").order("created_at", { ascending: false });
      if (activeCategory !== "All") q = q.eq("category", activeCategory);
      const { data } = await q;
      setVideos(data && data.length > 0 ? data : mockVideos);
    };
    fetchVideos();
  }, [activeCategory]);

  const filtered = activeCategory === "All" ? videos : videos.filter(v => v.category === activeCategory);

  const handleUpload = () => {
    if (!user) {
      toast.error("Please sign in to upload");
      return;
    }
    toast.info("Video upload coming soon!");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-bold text-foreground">Buzz</h1>
            <p className="text-xs text-muted-foreground">MUN moments that matter</p>
          </div>
          <Button size="sm" className="bg-accent text-accent-foreground hover:opacity-90 h-8 text-xs" onClick={handleUpload}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Create
          </Button>
        </div>

        {/* Categories - Stories style */}
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

        {/* Video Feed - Instagram Reels style */}
        <div className="px-4 space-y-4 pb-4">
          {filtered.map((video: any) => (
            <div
              key={video.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {/* Video Header */}
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/40 to-accent/10 flex items-center justify-center">
                  <span className="text-accent text-[10px] font-bold">AU</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">AudenaMUN Delegate</p>
                  <p className="text-[10px] text-muted-foreground">{video.category}</p>
                </div>
                {video.featured && (
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                    ⭐ Featured
                  </span>
                )}
              </div>

              {/* Video Player */}
              <div className="relative aspect-[4/5] bg-secondary">
                <img src={video.thumbnail_url || buzzImg} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center backdrop-blur-md border border-foreground/20 cursor-pointer hover:bg-foreground/20 transition-colors">
                    <Play className="h-7 w-7 text-foreground ml-1" />
                  </div>
                </div>
              </div>

              {/* Engagement Bar */}
              <div className="p-3.5">
                <div className="flex items-center gap-4 mb-2">
                  <button className="flex items-center gap-1.5 text-foreground hover:text-accent transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                  <button className="text-foreground hover:text-accent transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">{video.views}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground">{video.likes} likes</p>
                <p className="text-xs text-foreground mt-1">{video.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Buzz;
