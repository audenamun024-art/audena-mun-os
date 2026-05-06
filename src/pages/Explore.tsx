import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Search, Sliders, Heart, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const CATEGORIES = ["For You", "Trending", "Business", "Tech", "Speech", "Reaction"] as const;

const Explore = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("For You");
  const [posts, setPosts] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isLikelyId = useMemo(() => /^[a-z0-9-]{6,}$/i.test(query.trim()), [query]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const term = query.trim().toLowerCase();
      let q = supabase.from("posts").select("*").order("likes_count", { ascending: false }).limit(60);
      if (category !== "For You" && category !== "Trending") {
        q = q.eq("category", category.toLowerCase());
      }
      const { data } = await q;
      let results = data || [];
      if (term) {
        results = results.filter((p: any) =>
          (p.caption || "").toLowerCase().includes(term) ||
          String(p.id || "").toLowerCase().includes(term) ||
          String(p.user_id || "").toLowerCase().includes(term)
        );

        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, user_id, full_name, institution, avatar_url, rank_points")
          .or(`full_name.ilike.%${term}%,institution.ilike.%${term}%,user_id.ilike.%${term}%,id.ilike.%${term}%`)
          .limit(12);
        setPeople(profileRows || []);
      } else {
        setPeople([]);
      }
      setPosts(results);
      setLoading(false);
    };
    const t = setTimeout(fetchPosts, 250);
    return () => clearTimeout(t);
  }, [query, category]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 space-y-5">
        {/* Search */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, people, ideas..."
              className="pl-11 h-12 rounded-2xl bg-secondary/60 border-border focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
          <button className="h-12 w-12 rounded-2xl glass-panel flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
            <Sliders className="h-4 w-4" />
          </button>
        </div>

        {people.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Profiles</h2>
              {isLikelyId && <span className="text-[10px] text-muted-foreground">ID search</span>}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {people.map((p) => (
                <Link
                  key={p.id}
                  to={`/profile/${p.user_id}`}
                  className="glass-panel rounded-2xl p-3 flex items-center gap-3 hover:border-primary/40 transition-colors"
                >
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.full_name || "Profile"} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground">
                      <UserRound className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{p.full_name || "Unnamed"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.institution || `ID: ${p.user_id.slice(0, 8)}`}</p>
                  </div>
                  <span className="text-[10px] rounded-full bg-primary/10 px-2 py-0.5 text-primary font-semibold">View</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                category === cat
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "glass-panel text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">No posts found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {posts.map((p) => (
              <div key={p.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-panel group cursor-pointer hover:shadow-glow transition-all duration-300">
                <img src={p.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-semibold text-white line-clamp-2">{p.caption || "Untitled"}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Heart className="h-3 w-3 text-primary-glow fill-primary-glow" />
                    <span className="text-[10px] text-white/80 font-medium">{p.likes_count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Explore;
