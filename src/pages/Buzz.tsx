import AppLayout from "@/components/layout/AppLayout";
import { Heart, MessageCircle, Eye, Play } from "lucide-react";
import { useState } from "react";

const categories = ["All", "Best Speech", "Crisis Reaction", "Debate Moment", "Award"];

const videos = [
  { id: 1, title: "Powerful Opening Statement – UNSC", author: "Arjun Mehta", institution: "St. Xavier's", category: "Best Speech", views: 1240, likes: 89, comments: 12, featured: true },
  { id: 2, title: "Crisis Response: Nuclear Threat", author: "Priya Sharma", institution: "LSR", category: "Crisis Reaction", views: 980, likes: 67, comments: 8, featured: false },
  { id: 3, title: "Heated Debate on Climate Policy", author: "Rohan Kapoor", institution: "Hindu College", category: "Debate Moment", views: 756, likes: 45, comments: 5, featured: false },
  { id: 4, title: "Best Delegate Award Speech", author: "Ananya Gupta", institution: "Miranda House", category: "Award", views: 2100, likes: 156, comments: 23, featured: true },
  { id: 5, title: "DISEC Emergency Session Response", author: "Vikram Singh", institution: "Hansraj", category: "Crisis Reaction", views: 620, likes: 34, comments: 3, featured: false },
  { id: 6, title: "Closing Ceremony Highlights", author: "Meera Patel", institution: "SRCC", category: "Award", views: 1890, likes: 120, comments: 18, featured: false },
];

const Buzz = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? videos : videos.filter((v) => v.category === activeCategory);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="bg-navy-gradient px-5 pt-5 pb-6">
          <h1 className="text-xl font-serif font-bold text-gold-light mb-1">Buzz</h1>
          <p className="text-sm text-gold-light/60">Watch the best MUN moments from across the country</p>
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
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-4 pb-4">
          {filtered.map((video) => (
            <div
              key={video.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-elevated transition-shadow"
            >
              <div className="bg-navy-gradient h-48 flex items-center justify-center relative">
                <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center border-2 border-gold/40 cursor-pointer hover:bg-gold/30 transition-colors">
                  <Play className="h-6 w-6 text-gold-light ml-0.5" />
                </div>
                {video.featured && (
                  <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⭐ Featured
                  </span>
                )}
                <span className="absolute bottom-3 right-3 bg-navy-dark/80 text-gold-light text-[10px] px-2 py-0.5 rounded">
                  0:45
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-1">{video.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{video.author} · {video.institution}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{video.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{video.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{video.comments}</span>
                  <span className="ml-auto text-[10px] bg-muted px-2 py-0.5 rounded-full">{video.category}</span>
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
