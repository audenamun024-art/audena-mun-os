import AppLayout from "@/components/layout/AppLayout";
import { Heart, MessageCircle, Eye, Play, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-xl font-serif font-bold text-foreground mb-1">Buzz</h1>
          <p className="text-sm text-muted-foreground">Watch the best MUN moments</p>
        </div>

        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
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
          {filtered.map((video: any) => (
            <div
              key={video.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-accent/20 transition-colors"
            >
              <div className="relative aspect-video">
                <img src={video.thumbnail_url || buzzImg} alt={video.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                    <Play className="h-6 w-6 text-foreground ml-0.5" />
                  </div>
                </div>
                {video.featured && (
                  <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⭐ Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-2">{video.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{video.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{video.likes}</span>
                  <button className="ml-auto"><Share2 className="h-3.5 w-3.5" /></button>
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
