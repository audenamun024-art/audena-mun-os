import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Shield, Flag, BarChart3, Home, ArrowLeft, Trash2, Image as ImageIcon,
  Video, Sparkles, Eye, Activity, RefreshCw, Search, AlertTriangle, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import audenaLogo from "@/assets/audena-logo.jpg";

type Tab = "overview" | "users" | "videos" | "posts" | "stories";

const Admin = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pulse, setPulse] = useState(false);

  const fetchAll = async () => {
    const [profRes, vidRes, postRes, storyRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("stories").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setProfiles(profRes.data || []);
    setVideos(vidRes.data || []);
    setPosts(postRes.data || []);
    setStories(storyRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    // Realtime subscriptions
    const flash = () => { setPulse(true); setTimeout(() => setPulse(false), 800); };

    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { fetchAll(); flash(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ---- actions ----
  const handleFlagVideo = async (id: string, flagged: boolean) => {
    const { error } = await supabase.from("videos").update({ flagged: !flagged }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(flagged ? "Video unflagged" : "Video flagged");
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Delete this video permanently?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Video deleted");
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Delete this story permanently?")) return;
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Story deleted");
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Delete this user profile? (auth user remains)")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profile deleted");
  };

  // ---- derived ----
  const filtered = (list: any[], keys: string[]) =>
    !search ? list : list.filter((x) => keys.some((k) => (x[k] || "").toString().toLowerCase().includes(search.toLowerCase())));

  const stats = [
    { label: "Users", value: profiles.length, icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Videos", value: videos.length, icon: Video, color: "from-indigo-500 to-blue-500" },
    { label: "Posts", value: posts.length, icon: ImageIcon, color: "from-cyan-500 to-sky-500" },
    { label: "Stories", value: stories.length, icon: Sparkles, color: "from-sky-500 to-blue-500" },
    { label: "Flagged", value: videos.filter((v) => v.flagged).length, icon: AlertTriangle, color: "from-amber-500 to-orange-500" },
    { label: "Total Views", value: videos.reduce((s, v) => s + (v.views || 0), 0), icon: Eye, color: "from-blue-600 to-indigo-600" },
  ];

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "overview", label: "Overview", icon: BarChart3, count: 0 },
    { key: "users", label: "Users", icon: Users, count: profiles.length },
    { key: "videos", label: "Videos", icon: Video, count: videos.length },
    { key: "posts", label: "Posts", icon: ImageIcon, count: posts.length },
    { key: "stories", label: "Stories", icon: Sparkles, count: stories.length },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Backdrop glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-border/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16 relative">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-secondary text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white ring-1 ring-primary/30">
              <img src={audenaLogo} alt="Audena Hub" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-base font-display font-bold text-gradient-primary leading-none">Audena Admin</p>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${pulse ? "bg-success animate-ping" : "bg-success"}`} /> Live Control Center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-xs" onClick={fetchAll}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${pulse ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link to="/"><Button variant="ghost" size="sm" className="text-xs"><Home className="h-4 w-4 mr-1" /> App</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Control Center
            </h1>
            <p className="text-sm text-muted-foreground">Realtime moderation across the entire platform</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, captions, titles..."
              className="pl-9 h-10 rounded-xl bg-secondary/60"
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-panel rounded-xl p-4 shadow-card hover:border-primary/40 transition-colors">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2.5 shadow-glow`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>}
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-secondary/50 rounded-2xl p-1 border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-secondary"}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-primary" /><h2 className="text-base font-bold">Activity Pulse</h2></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Active users</span><span className="font-bold text-foreground">{profiles.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Videos uploaded</span><span className="font-bold text-foreground">{videos.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Explore posts</span><span className="font-bold text-foreground">{posts.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Live stories</span><span className="font-bold text-foreground">{stories.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"><span className="text-amber-300">Flagged content</span><span className="font-bold text-amber-300">{videos.filter((v) => v.flagged).length}</span></div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-base font-bold">Latest Uploads</h2></div>
              <div className="space-y-2">
                {[...videos.slice(0, 3), ...posts.slice(0, 2)].slice(0, 5).map((item: any, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {item.image_url ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title || item.caption || "Untitled"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {videos.length === 0 && posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No content yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <section className="space-y-2 animate-fade-in">
            {filtered(profiles, ["full_name", "institution"]).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-4 glass-panel rounded-xl shadow-card">
                <span className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-glow">#{i + 1}</span>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {(p.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.institution || "No institution"} · {p.rank_points || 0} pts</p>
                </div>
                <Link to={`/profile/${p.user_id}`} className="p-2 hover:bg-secondary rounded-lg"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></Link>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-8" onClick={() => handleDeleteProfile(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {profiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No users yet</p>}
          </section>
        )}

        {/* VIDEOS */}
        {activeTab === "videos" && (
          <section className="space-y-2 animate-fade-in">
            {filtered(videos, ["title", "category", "caption"]).map((v) => (
              <div key={v.id} className={`flex items-center gap-3 p-3 glass-panel rounded-xl shadow-card ${v.flagged ? "border-amber-500/40" : ""}`}>
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Video className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{v.title || "Untitled"}</p>
                    {v.flagged && <Badge variant="outline" className="text-amber-300 border-amber-500/40 text-[9px] py-0">FLAGGED</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.category || "Uncategorized"} · {v.views || 0} views · {new Date(v.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleFlagVideo(v.id, v.flagged)}>
                    <Flag className="h-3 w-3 mr-1" /> {v.flagged ? "Unflag" : "Flag"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-8" onClick={() => handleDeleteVideo(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {videos.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No videos</p>}
          </section>
        )}

        {/* POSTS */}
        {activeTab === "posts" && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
            {filtered(posts, ["caption", "category"]).map((p) => (
              <div key={p.id} className="glass-panel rounded-xl overflow-hidden shadow-card group">
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{p.caption || "No caption"}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.category || "—"} · ❤ {p.likes_count}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-destructive border-destructive/30 h-8 text-xs" onClick={() => handleDeletePost(p.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-12">No posts</p>}
          </section>
        )}

        {/* STORIES */}
        {activeTab === "stories" && (
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in">
            {filtered(stories, ["caption"]).map((s) => {
              const expired = new Date(s.expires_at) < new Date();
              return (
                <div key={s.id} className="glass-panel rounded-xl overflow-hidden shadow-card relative group">
                  <div className="aspect-[9/16] bg-secondary relative">
                    {s.media_type === "video" ? (
                      <video src={s.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={s.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {expired && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="outline" className="text-amber-300 border-amber-500/40 text-[9px]">EXPIRED</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-muted-foreground truncate">{new Date(s.created_at).toLocaleDateString()}</p>
                    <Button size="sm" variant="outline" className="w-full mt-1.5 text-destructive border-destructive/30 h-7 text-[11px]" onClick={() => handleDeleteStory(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {stories.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-12">No stories</p>}
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;
