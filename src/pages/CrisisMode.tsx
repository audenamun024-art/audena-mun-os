import AppLayout from "@/components/layout/AppLayout";
import { AlertTriangle, Radio, Clock, MessageSquare, Shield } from "lucide-react";

const updates = [
  { time: "14:32", message: "Emergency session initiated by Security Council Chair", type: "alert" },
  { time: "14:28", message: "All delegates must return to committee rooms immediately", type: "directive" },
  { time: "14:25", message: "Breaking: Unidentified military movements detected near disputed border", type: "intel" },
  { time: "14:20", message: "Crisis scenario activated for UNSC and DISEC committees", type: "alert" },
  { time: "14:15", message: "EB members report to crisis command center", type: "directive" },
];

const CrisisMode = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Alert Banner */}
        <div className="bg-gradient-to-r from-red-900/90 to-red-800/90 px-5 pt-5 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <AlertTriangle className="h-5 w-5 text-red-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-xs font-bold text-red-300 tracking-wider uppercase">Crisis Active</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-white mb-1">Security Council Crisis</h1>
          <p className="text-sm text-red-200/70">Real-time updates from the crisis command center</p>
        </div>

        {/* Status */}
        <div className="px-4 grid grid-cols-3 gap-3">
          {[
            { icon: Radio, label: "Status", value: "ACTIVE" },
            { icon: Clock, label: "Duration", value: "1h 17m" },
            { icon: Shield, label: "Committees", value: "2 Active" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-3 text-center shadow-card">
              <s.icon className="h-4 w-4 text-destructive mx-auto mb-1" />
              <p className="text-xs font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Live Feed */}
        <section className="px-4 pb-4">
          <h2 className="font-serif text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" /> Live Feed
          </h2>
          <div className="space-y-3">
            {updates.map((u, i) => (
              <div key={i} className={`rounded-xl border p-4 shadow-card ${
                u.type === "alert"
                  ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
                  : u.type === "intel"
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                  : "bg-card border-border"
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{u.time}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed">{u.message}</p>
                    <span className={`text-[10px] font-medium mt-1 inline-block px-2 py-0.5 rounded-full ${
                      u.type === "alert" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                      u.type === "intel" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {u.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default CrisisMode;
