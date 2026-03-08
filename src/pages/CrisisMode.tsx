import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { AlertTriangle, Radio, Clock, MessageSquare, Shield, Users, Send, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CrisisMode = () => {
  const { user, roles } = useAuth();
  const [crisisActive, setCrisisActive] = useState(false);
  const [committees, setCommittees] = useState<any[]>([]);
  const [delegates, setDelegates] = useState<any[]>([]);
  const [researchLogs, setResearchLogs] = useState<any[]>([]);
  const [crisisMessage, setCrisisMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([
    { time: "—", message: "No crisis events yet. Activate Crisis Mode to begin.", type: "info" },
  ]);

  const isEB = roles.has("eb") || roles.has("admin");

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: comms }, { data: regs }, { data: logs }] = await Promise.all([
        supabase.from("committees").select("*, events(title)").limit(20),
        supabase.from("registrations").select("*, profiles:user_id(full_name, institution)").eq("status", "approved").limit(50),
        supabase.from("research_logs").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      setCommittees(comms || []);
      setDelegates(regs || []);
      setResearchLogs(logs || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const activateCrisis = () => {
    setCrisisActive(true);
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setUpdates(prev => [{ time: now, message: "🚨 Crisis Mode activated! All committees are now in emergency session.", type: "alert" }, ...prev]);
    toast.success("Crisis Mode activated");
  };

  const deactivateCrisis = () => {
    setCrisisActive(false);
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setUpdates(prev => [{ time: now, message: "Crisis Mode deactivated. Returning to normal proceedings.", type: "info" }, ...prev]);
    toast.info("Crisis Mode deactivated");
  };

  const sendCrisisUpdate = () => {
    if (!crisisMessage.trim()) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setUpdates(prev => [{ time: now, message: crisisMessage, type: "directive" }, ...prev]);
    setCrisisMessage("");
    toast.success("Crisis update broadcast");
  };

  const suspiciousDelegates = researchLogs.filter(l => l.action === "blocked_site" || (l.exit_count && l.exit_count > 2));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className={`rounded-xl p-5 border ${crisisActive ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <AlertTriangle className={`h-6 w-6 ${crisisActive ? "text-destructive" : "text-muted-foreground"}`} />
                {crisisActive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {crisisActive ? "🚨 Crisis Active" : "Crisis Command Center"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {crisisActive ? "Emergency session in progress" : "EB & Admin crisis management tools"}
                </p>
              </div>
            </div>
            {isEB && (
              crisisActive ? (
                <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={deactivateCrisis}>
                  Deactivate Crisis
                </Button>
              ) : (
                <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={activateCrisis}>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Activate Crisis
                </Button>
              )
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Radio, label: "Status", value: crisisActive ? "ACTIVE" : "STANDBY", color: crisisActive ? "text-destructive" : "text-muted-foreground" },
            { icon: Users, label: "Committees", value: committees.length, color: "text-primary" },
            { icon: Shield, label: "Active Delegates", value: delegates.length, color: "text-accent" },
            { icon: Activity, label: "Suspicious", value: suspiciousDelegates.length, color: suspiciousDelegates.length > 0 ? "text-destructive" : "text-success" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{loading ? <Skeleton className="h-6 w-12 mx-auto" /> : s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live Feed */}
          <div className="lg:col-span-2 space-y-4">
            {isEB && crisisActive && (
              <div className="flex gap-2">
                <Input
                  value={crisisMessage}
                  onChange={(e) => setCrisisMessage(e.target.value)}
                  placeholder="Broadcast a crisis update..."
                  className="bg-secondary border-border"
                  onKeyDown={(e) => e.key === "Enter" && sendCrisisUpdate()}
                />
                <Button size="icon" className="bg-gradient-primary text-primary-foreground shrink-0" onClick={sendCrisisUpdate}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" /> Live Feed
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {updates.map((u, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${
                    u.type === "alert" ? "bg-destructive/5 border-destructive/20" :
                    u.type === "directive" ? "bg-primary/5 border-primary/20" :
                    "bg-card border-border"
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{u.time}</span>
                      <div>
                        <p className="text-sm text-foreground">{u.message}</p>
                        <span className={`text-[10px] font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${
                          u.type === "alert" ? "bg-destructive/10 text-destructive" :
                          u.type === "directive" ? "bg-primary/10 text-primary" :
                          "bg-secondary text-muted-foreground"
                        }`}>{u.type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delegate Monitoring Sidebar */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" /> Delegate Monitor
              </h2>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg mb-2" />)
              ) : delegates.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No active delegates</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {delegates.slice(0, 15).map((d: any, i) => {
                    const log = researchLogs.find(l => l.user_id === d.user_id);
                    const exitCount = log?.exit_count || 0;
                    const status = exitCount > 2 ? "red" : exitCount > 0 ? "yellow" : "green";
                    return (
                      <div key={d.id} className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${status === "green" ? "bg-success" : status === "yellow" ? "bg-warning" : "bg-destructive"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{(d as any).profiles?.full_name || `Delegate ${i + 1}`}</p>
                          <p className="text-[10px] text-muted-foreground">{exitCount} exits</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Recent Logs
              </h2>
              {researchLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No research activity</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {researchLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="text-[11px] p-2 bg-secondary rounded-lg">
                      <span className="text-muted-foreground font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                      {" — "}
                      <span className={`font-medium ${log.action === "blocked_site" ? "text-destructive" : "text-foreground"}`}>
                        {log.action === "blocked_site" ? "⚠ Blocked site attempt" : log.action === "exit" ? "App exited" : log.action || "Browse"}
                      </span>
                      {log.url && <span className="text-muted-foreground block truncate">{log.url}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CrisisMode;
