import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import { UserPlus, UserCheck, Clock, Video as VideoIcon, Grid3x3, Play, Heart, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { getStatus, connect, acceptConnection, removeConnection, networkCount: myNetworkCount } = useConnections();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [networkCount, setNetworkCount] = useState(0);
  const [contentTab, setContentTab] = useState<"videos" | "posts">("videos");

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    const fetch = async () => {
      if (!userId) return;
      setLoading(true);
      const [{ data: p }, { data: vids }, { data: pposts }, { data: conns }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("videos").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        (supabase.from("connections" as any) as any)
          .select("id")
          .eq("status", "connected")
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
      ]);
      setProfile(p);
      setVideos((vids as any[]) || []);
      setPosts((pposts as any[]) || []);
      setNetworkCount((conns as any[])?.length || 0);
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const connectionStatus = userId ? getStatus(userId) : "none";

  const handleConnect = async () => {
    if (!userId) return;
    if (connectionStatus === "none") {
      await connect(userId);
      toast.success("Connection request sent!");
    } else if (connectionStatus === "received") {
      await acceptConnection(userId);
      toast.success("Connected!");
    } else if (connectionStatus === "connected" || connectionStatus === "pending") {
      await removeConnection(userId);
      toast.success("Connection removed");
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const buttonConfig = {
    none: { label: "Connect", icon: UserPlus, variant: "default" as const },
    pending: { label: "Requested", icon: Clock, variant: "outline" as const },
    received: { label: "Connect Back", icon: UserPlus, variant: "default" as const },
    connected: { label: "Connected", icon: UserCheck, variant: "secondary" as const },
  };

  const btn = buttonConfig[connectionStatus];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
            <div className="flex items-start gap-5">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ) : !profile ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-card">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-foreground text-2xl font-bold">{initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{profile.full_name}</h1>
                <p className="text-xs text-muted-foreground mb-1.5">{profile.institution || "No institution"}</p>
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                  AudenaHub Member
                </span>
              </div>
            </div>

            <div className="flex justify-around mt-5 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{videos.length + posts.length}</p>
                <p className="text-[10px] text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{networkCount}</p>
                <p className="text-[10px] text-muted-foreground">Network</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary font-semibold">
                  {connectionStatus === "connected" ? "✓" : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">Connect</p>
              </div>
            </div>

            {profile.bio && (
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed bg-secondary/50 rounded-xl p-3">{profile.bio}</p>
            )}

            {!isOwnProfile && user && (
              <div className="mt-4">
                <Button
                  className={`w-full h-10 rounded-xl font-semibold ${
                    connectionStatus === "none" || connectionStatus === "received"
                      ? "bg-gradient-primary text-primary-foreground"
                      : ""
                  }`}
                  variant={btn.variant}
                  onClick={handleConnect}
                >
                  <btn.icon className="h-4 w-4 mr-2" />
                  {btn.label}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Content grid */}
        {!loading && profile && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1 border-t border-border pt-3">
              <button
                onClick={() => setContentTab("videos")}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  contentTab === "videos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <VideoIcon className="h-3.5 w-3.5" /> Buzz <span className="text-[10px] opacity-70">({videos.length})</span>
              </button>
              <button
                onClick={() => setContentTab("posts")}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                  contentTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3x3 className="h-3.5 w-3.5" /> Posts <span className="text-[10px] opacity-70">({posts.length})</span>
              </button>
            </div>

            {contentTab === "videos" && (
              videos.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <VideoIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No buzz videos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {videos.map((v) => (
                    <div key={v.id} className="relative aspect-[9/16] bg-secondary rounded-md overflow-hidden group">
                      {v.thumbnail_url ? (
                        <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-full p-1">
                        <Play className="h-2.5 w-2.5 text-white fill-white" />
                      </div>
                      <div className="absolute bottom-1 right-1.5 text-[9px] text-white/80 flex items-center gap-0.5">
                        <Play className="h-2 w-2" /> {v.views || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {contentTab === "posts" && (
              posts.length === 0 ? (
                <div className="text-center py-12 glass-panel rounded-2xl">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((p) => (
                    <div key={p.id} className="relative aspect-square bg-secondary rounded-md overflow-hidden group">
                      <img src={p.image_url} alt={p.caption || ""} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-white" /> {p.likes_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PublicProfile;
