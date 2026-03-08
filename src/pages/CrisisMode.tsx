import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  AlertTriangle, Radio, Clock, MessageSquare, Shield, Users, Send, Activity,
  Eye, EyeOff, Zap, Globe, MonitorSmartphone, ChevronRight, Wifi, WifiOff
} from "lucide-react";
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
  const [activePanel, setActivePanel] = useState<"feed" | "monitor" | "logs">("feed");
  const [updates, setUpdates] = useState([
    { time: "—", message: "No crisis events yet. Activate Crisis Mode to begin.", type: "info" },
  ]);

  const isEB = roles.has("eb") || roles.has("admin");

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: comms }, { data: regs }, { data: logs }] = await Promise.all([
        supabase.from("committees").select("*, events(title)").limit(20),
        supabase.from("registrations").select("*, profiles:user_id(full_name, institution)").eq("status", "approved").limit(50),
        supabase.from("research_logs").select("*").order("created_at", { ascending: false }).limit(50),
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
    setUpdates(prev => [{ time: now, message: "🚨 CRISIS ACTIVATED — All committees entering emergency session. Delegates must remain in their seats.", type: "alert" }, ...prev]);
    toast.success("Crisis Mode activated");
  };

  const deactivateCrisis = () => {
    setCrisisActive(false);
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setUpdates(prev => [{ time: now, message: "Crisis deactivated. Normal proceedings resume.", type: "info" }, ...prev]);
    toast.info("Crisis Mode deactivated");
  };

  const sendCrisisUpdate = () => {
    if (!crisisMessage.trim()) return;
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setUpdates(prev => [{ time: now, message: crisisMessage, type: "directive" }, ...prev]);
    setCrisisMessage("");
    toast.success("Broadcast sent");
  };

  const suspiciousDelegates = researchLogs.filter(l => l.action === "blocked_site" || (l.exit_count && l.exit_count > 2));
  const blockedAttempts = researchLogs.filter(l => l.action === "blocked_site").length;
  const totalExits = researchLogs.reduce((sum, l) => sum + (l.exit_count || 0), 0);

  const panels = [
    { key: "feed", label: "Live Feed", icon: Radio },
    { key: "monitor", label: "Delegates", icon: Eye },
    { key: "logs", label: "Activity Log", icon: Activity },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Crisis Header */}
        <div className={`rounded-2xl p-6 border transition-all ${
          crisisActive
            ? "bg-destructive/5 border-destructive/20 shadow-[0_0_30px_-10px] shadow-destructive/20"
            : "bg-card border-border shadow-card"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${
                crisisActive ? "bg-destructive/10" : "bg-secondary"
              }`}>
                <AlertTriangle className={`h-6 w-6 ${crisisActive ? "text-destructive" : "text-muted-foreground"}`} />
                {crisisActive && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse-soft flex items-center justify-center">
                    <span className="w-2 h-2 bg-destructive-foreground rounded-full" />
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {crisisActive ? "🚨 Crisis Active" : "Crisis Command Center"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {crisisActive ? "Emergency session in progress — all delegates monitored" : "EB & Admin crisis management dashboard"}
                </p>
              </div>
            </div>
            {isEB && (
              crisisActive ? (
                <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 h-10 rounded-xl gap-1.5" onClick={deactivateCrisis}>
                  <WifiOff className="h-4 w-4" /> Deactivate
                </Button>
              ) : (
                <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 rounded-xl gap-1.5" onClick={activateCrisis}>
                  <Zap className="h-4 w-4" /> Activate Crisis
                </Button>
              )
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Radio, label: "Status", value: crisisActive ? "ACTIVE" : "STANDBY", color: crisisActive ? "text-destructive" : "text-muted-foreground", bg: crisisActive ? "bg-destructive/8" : "bg-secondary" },
            { icon: Users, label: "Active Delegates", value: delegates.length, color: "text-primary", bg: "bg-primary/8" },
            { icon: Globe, label: "Blocked Attempts", value: blockedAttempts, color: blockedAttempts > 0 ? "text-destructive" : "text-success", bg: blockedAttempts > 0 ? "bg-destructive/8" : "bg-success/8" },
            { icon: MonitorSmartphone, label: "App Exits", value: totalExits, color: totalExits > 5 ? "text-warning" : "text-success", bg: totalExits > 5 ? "bg-warning/8" : "bg-success/8" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {loading ? <Skeleton className="h-6 w-12" /> : s.value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-1 bg-secondary/60 rounded-2xl p-1.5">
          {panels.map((p) => (
            <button key={p.key} onClick={() => setActivePanel(p.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap flex-1 justify-center ${
                activePanel === p.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              <p.icon className="h-3.5 w-3.5" />{p.label}
            </button>
          ))}
        </div>

        {/* Live Feed Panel */}
        {activePanel === "feed" && (
          <div className="space-y-4 animate-fade-in">
            {isEB && crisisActive && (
              <div className="flex gap-2">
                <Input
                  value={crisisMessage}
                  onChange={(e) => setCrisisMessage(e.target.value)}
                  placeholder="Broadcast a directive to all committees..."
                  className="bg-card border-border h-11 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && sendCrisisUpdate()}
                />
                <Button className="bg-gradient-primary text-primary-foreground shrink-0 h-11 rounded-xl gap-1.5" onClick={sendCrisisUpdate}>
                  <Send className="h-4 w-4" /> Send
                </Button>
              </div>
            )}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Radio className={`h-4 w-4 ${crisisActive ? "text-destructive animate-pulse-soft" : "text-primary"}`} /> Live Broadcast Feed
              </h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {updates.map((u, i) => (
                  <div key={i} className={`rounded-xl border p-4 transition-all ${
                    u.type === "alert" ? "bg-destructive/5 border-destructive/15" :
                    u.type === "directive" ? "bg-primary/5 border-primary/15" :
                    "bg-secondary/50 border-border"
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0 mt-0.5 bg-secondary px-2 py-0.5 rounded-md">{u.time}</span>
                      <div className="flex-1">
                        <p className="text-sm text-foreground leading-relaxed">{u.message}</p>
                        <span className={`text-[9px] font-bold mt-1.5 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          u.type === "alert" ? "bg-destructive/10 text-destructive" :
                          u.type === "directive" ? "bg-primary/10 text-primary" :
                          "bg-secondary text-muted-foreground"
                        }`}>{u.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Delegate Monitor Panel */}
        {activePanel === "monitor" && (
          <div className="animate-fade-in">
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Delegate Activity Monitor
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  {suspiciousDelegates.length} flagged
                </span>
              </div>
              {loading ? (
                <div className="p-5 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : delegates.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No approved delegates to monitor</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {delegates.slice(0, 20).map((d: any, i) => {
                    const log = researchLogs.find(l => l.user_id === d.user_id);
                    const exitCount = log?.exit_count || 0;
                    const blocked = researchLogs.filter(l => l.user_id === d.user_id && l.action === "blocked_site").length;
                    const status = exitCount > 2 || blocked > 0 ? "red" : exitCount > 0 ? "yellow" : "green";
                    return (
                      <div key={d.id} className={`flex items-center gap-4 px-5 py-3.5 ${
                        status === "red" ? "bg-destructive/3" : ""
                      }`}>
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground">
                              {((d as any).profiles?.full_name || "D")[0].toUpperCase()}
                            </span>
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                            status === "green" ? "bg-success" : status === "yellow" ? "bg-warning" : "bg-destructive"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {(d as any).profiles?.full_name || `Delegate ${i + 1}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {(d as any).profiles?.institution || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <div className="text-center">
                            <p className={`font-bold ${exitCount > 2 ? "text-destructive" : "text-foreground"}`}>{exitCount}</p>
                            <p className="text-muted-foreground">Exits</p>
                          </div>
                          <div className="text-center">
                            <p className={`font-bold ${blocked > 0 ? "text-destructive" : "text-foreground"}`}>{blocked}</p>
                            <p className="text-muted-foreground">Blocked</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            status === "green" ? "bg-success/10 text-success" :
                            status === "yellow" ? "bg-warning/10 text-warning" :
                            "bg-destructive/10 text-destructive"
                          }`}>{status === "green" ? "Clean" : status === "yellow" ? "Watch" : "Flagged"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Log Panel */}
        {activePanel === "logs" && (
          <div className="animate-fade-in">
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Research Activity Log
                </h2>
              </div>
              {researchLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No research activity recorded</p>
                </div>
              ) : (
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                  {researchLogs.map((log) => (
                    <div key={log.id} className={`flex items-center gap-4 px-5 py-3 ${
                      log.action === "blocked_site" ? "bg-destructive/3" : ""
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.action === "blocked_site" ? "bg-destructive/10" :
                        log.action === "exit" ? "bg-warning/10" : "bg-secondary"
                      }`}>
                        {log.action === "blocked_site" ? <EyeOff className="h-3.5 w-3.5 text-destructive" /> :
                         log.action === "exit" ? <MonitorSmartphone className="h-3.5 w-3.5 text-warning" /> :
                         <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${log.action === "blocked_site" ? "text-destructive" : "text-foreground"}`}>
                          {log.action === "blocked_site" ? "Blocked site attempt" :
                           log.action === "exit" ? "App exited" : log.action || "Page visit"}
                        </p>
                        {log.url && <p className="text-[10px] text-muted-foreground truncate">{log.url}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CrisisMode;
