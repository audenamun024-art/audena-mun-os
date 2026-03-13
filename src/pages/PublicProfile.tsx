import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConnections } from "@/hooks/useConnections";
import { UserPlus, UserCheck, Clock, UserMinus } from "lucide-react";
import { toast } from "sonner";

const PublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { getStatus, connect, acceptConnection, removeConnection, networkCount: myNetworkCount } = useConnections();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dropCount, setDropCount] = useState(0);
  const [networkCount, setNetworkCount] = useState(0);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    const fetch = async () => {
      if (!userId) return;
      setLoading(true);
      const [{ data: p }, { data: videos }, { data: conns }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("videos").select("id").eq("user_id", userId),
        (supabase.from("connections" as any) as any)
          .select("id")
          .eq("status", "connected")
          .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
      ]);
      setProfile(p);
      setDropCount((videos as any[])?.length || 0);
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
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold capitalize">
                  {profile.account_type}
                </span>
              </div>
            </div>

            <div className="flex justify-around mt-5 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{dropCount}</p>
                <p className="text-[10px] text-muted-foreground">Drop</p>
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
      </div>
    </AppLayout>
  );
};

export default PublicProfile;
