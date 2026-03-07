import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const timeFilters = ["Weekly", "Monthly", "All-Time"];
const medals = ["🥇", "🥈", "🥉"];

const Rankboard = () => {
  const [activeFilter, setActiveFilter] = useState("All-Time");
  const [search, setSearch] = useState("");
  const [delegates, setDelegates] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("rank_points", { ascending: false }).limit(50).then(({ data }) => {
      if (data && data.length > 0) setDelegates(data as any[]);
      else setDelegates([
        { full_name: "Arjun Mehta", institution: "St. Xavier's College", rank_points: 340, muns_attended: 12, awards_won: 5 },
        { full_name: "Priya Sharma", institution: "Lady Shri Ram College", rank_points: 290, muns_attended: 10, awards_won: 4 },
        { full_name: "Rohan Kapoor", institution: "Hindu College", rank_points: 270, muns_attended: 9, awards_won: 3 },
        { full_name: "Ananya Gupta", institution: "Miranda House", rank_points: 245, muns_attended: 8, awards_won: 3 },
        { full_name: "Vikram Singh", institution: "Hansraj College", rank_points: 220, muns_attended: 7, awards_won: 2 },
      ]);
    });
  }, []);

  const filtered = delegates.filter((d: any) => d.full_name?.toLowerCase().includes(search.toLowerCase()) || d.institution?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="px-5 pt-5 pb-4"><h1 className="text-xl font-bold text-foreground mb-1">Rankboard</h1><p className="text-sm text-muted-foreground">Top performing delegates</p></div>

        <div className="px-4">
          <div className="flex items-end justify-center gap-4 mb-4">
            {[1, 0, 2].map((idx) => {
              const d = filtered[idx];
              if (!d) return null;
              const isFirst = idx === 0;
              return (
                <div key={idx} className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                  <span className="text-2xl mb-1">{medals[idx === 0 ? 0 : idx === 1 ? 1 : 2]}</span>
                  <div className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} rounded-full bg-gradient-primary flex items-center justify-center border-2 border-primary/30 mb-1`}>
                    <span className="text-primary-foreground font-bold text-lg">{d.full_name?.[0]}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center">{d.full_name?.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{d.rank_points} pts</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 flex gap-2">
          {timeFilters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>

        <div className="px-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search delegates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" /></div>
        </div>

        <div className="px-4 space-y-2 pb-4">
          {filtered.map((d: any, i: number) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border shadow-card ${i < 3 ? "bg-card border-primary/20" : "bg-card border-border"}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{i < 3 ? medals[i] : `#${i + 1}`}</span>
              <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-foreground">{d.full_name}</p><p className="text-xs text-muted-foreground">{d.institution}</p></div>
              <div className="text-right"><p className="text-sm font-bold text-primary">{d.rank_points}</p><p className="text-[10px] text-muted-foreground">{d.muns_attended || 0} MUNs</p></div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Rankboard;
