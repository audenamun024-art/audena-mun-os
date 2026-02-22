import AppLayout from "@/components/layout/AppLayout";
import { AlertTriangle, Radio, Clock, MessageSquare, Shield } from "lucide-react";

const updates = [
  { time: "14:32", message: "Emergency session initiated by Security Council Chair", type: "alert" },
  { time: "14:28", message: "All delegates must return to committee rooms immediately", type: "directive" },
  { time: "14:25", message: "Breaking: Unidentified military movements detected", type: "intel" },
  { time: "14:20", message: "Crisis scenario activated for UNSC and DISEC", type: "alert" },
];

const CrisisMode = () => {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-red-950/90 to-red-900/50 px-5 pt-5 pb-6 border-b border-red-900/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-xs font-bold text-red-400 tracking-wider uppercase">Crisis Active</span>
          </div>
          <h1 className="text-xl font-serif font-bold text-foreground mb-1">Security Council Crisis</h1>
          <p className="text-sm text-red-300/60">Real-time updates from crisis command</p>
        </div>

        <div className="px-4 grid grid-cols-3 gap-2">
          {[
            { icon: Radio, label: "Status", value: "ACTIVE" },
            { icon: Clock, label: "Duration", value: "1h 17m" },
            { icon: Shield, label: "Committees", value: "2" },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
              <s.icon className="h-4 w-4 text-red-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="px-4 pb-4">
          <h2 className="font-serif text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" /> Live Feed
          </h2>
          <div className="space-y-2">
            {updates.map((u, i) => (
              <div key={i} className={`rounded-xl border p-4 ${
                u.type === "alert" ? "bg-red-950/30 border-red-900/50" :
                u.type === "intel" ? "bg-amber-950/30 border-amber-900/50" :
                "bg-card border-border"
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{u.time}</span>
                  <div>
                    <p className="text-sm text-foreground">{u.message}</p>
                    <span className={`text-[10px] font-medium mt-1 inline-block px-2 py-0.5 rounded-full ${
                      u.type === "alert" ? "bg-red-900/40 text-red-400" :
                      u.type === "intel" ? "bg-amber-900/40 text-amber-400" :
                      "bg-secondary text-muted-foreground"
                    }`}>{u.type.toUpperCase()}</span>
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
