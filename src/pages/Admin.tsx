import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Shield, Flag, BarChart3, LogOut, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Admin = () => {
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "buzz" | "posts">("overview");
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      const [profRes, vidRes, postRes] = await Promise.all([
        supabase.from("profiles").select("*").order("rank_points", { ascending: false }),
        supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setAllProfiles(profRes.data || []);
      setVideos(vidRes.data || []);
      setPosts(postRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleFlagVideo = async (id: string) => {
    await supabase.from("videos").update({ flagged: true }).eq("id", id);
    setVideos(videos.map((v) => (v.id === id ? { ...v, flagged: true } : v)));
    toast.info("Video flagged");
  };

  const handleDeleteVideo = async (id: string) => {
    await supabase.from("videos").delete().eq("id", id);
    setVideos(videos.filter((v) => v.id !== id));
    toast.success("Video deleted");
  };

  const handleDeletePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    setPosts(posts.filter((p) => p.id !== id));
    toast.success("Post deleted");
  };

  const stats = [
    { label: "Users", value: allProfiles.length, icon: Users },
    { label: "Videos", value: videos.length, icon: BarChart3 },
    { label: "Posts", value: posts.length, icon: Flag },
    { label: "Flagged", value: videos.filter((v) => v.flagged).length, icon: Shield },
  ];

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "buzz", label: "Buzz", icon: Flag },
    { key: "posts", label: "Posts", icon: BarChart3 },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass-panel border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link to="/" className="p-2 rounded-lg hover:bg-secondary text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-display font-bold text-gradient-primary">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/"><Button variant="ghost" size="sm" className="text-xs"><Home className="h-4 w-4 mr-1" /> App</Button></Link>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={async () => { await signOut(); navigate("/auth"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Control Center</h1>
          <p className="text-sm text-muted-foreground">Platform oversight</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-panel rounded-xl p-4 shadow-card">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"><s.icon className="h-4 w-4" /></div>
              <p className="text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-16" /> : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 overflow-x-auto bg-secondary/60 rounded-xl p-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="h-3.5 w-3.5" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="glass-panel rounded-xl p-5 animate-fade-in">
            <h2 className="text-base font-bold mb-3">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">{allProfiles.length} users · {videos.length} videos · {posts.length} explore posts</p>
          </div>
        )}

        {activeTab === "users" && (
          <section className="space-y-2 animate-fade-in">
            {allProfiles.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-4 glass-panel rounded-xl shadow-card">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">#{i + 1}</span>
                <div className="flex-1"><p className="font-semibold text-sm text-foreground">{p.full_name || "—"}</p><p className="text-xs text-muted-foreground">{p.institution || "No institution"}</p></div>
                <p className="text-sm font-bold text-primary">{p.rank_points || 0} pts</p>
              </div>
            ))}
            {allProfiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>}
          </section>
        )}

        {activeTab === "buzz" && (
          <section className="space-y-2 animate-fade-in">
            {videos.map((v) => (
              <div key={v.id} className={`flex items-center justify-between p-4 glass-panel rounded-xl shadow-card ${v.flagged ? "border-destructive/40" : ""}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{v.category} · {v.views || 0} views</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  {!v.flagged && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleFlagVideo(v.id)}><Flag className="h-3 w-3 mr-1" /> Flag</Button>}
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 text-xs h-7" onClick={() => handleDeleteVideo(v.id)}>Delete</Button>
                </div>
              </div>
            ))}
            {videos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No videos</p>}
          </section>
        )}

        {activeTab === "posts" && (
          <section className="space-y-2 animate-fade-in">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 glass-panel rounded-xl shadow-card">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{p.caption || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.likes_count} likes</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 text-xs h-7" onClick={() => handleDeletePost(p.id)}>Delete</Button>
              </div>
            ))}
            {posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No posts</p>}
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;
