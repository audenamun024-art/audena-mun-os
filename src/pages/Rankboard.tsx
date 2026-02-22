import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";

const timeFilters = ["Weekly", "Monthly", "All-Time"];
const medals = ["🥇", "🥈", "🥉"];

const delegates = [
  { rank: 1, name: "Arjun Mehta", institution: "St. Xavier's College", points: 340, muns: 12, awards: 5 },
  { rank: 2, name: "Priya Sharma", institution: "Lady Shri Ram College", points: 290, muns: 10, awards: 4 },
  { rank: 3, name: "Rohan Kapoor", institution: "Hindu College", points: 270, muns: 9, awards: 3 },
  { rank: 4, name: "Ananya Gupta", institution: "Miranda House", points: 245, muns: 8, awards: 3 },
  { rank: 5, name: "Vikram Singh", institution: "Hansraj College", points: 220, muns: 7, awards: 2 },
  { rank: 6, name: "Meera Patel", institution: "SRCC", points: 200, muns: 7, awards: 2 },
  { rank: 7, name: "Aditya Verma", institution: "Kirori Mal College", points: 185, muns: 6, awards: 2 },
  { rank: 8, name: "Kavya Nair", institution: "Presidency College", points: 170, muns: 6, awards: 1 },
  { rank: 9, name: "Siddharth Das", institution: "Jadavpur University", points: 155, muns: 5, awards: 1 },
  { rank: 10, name: "Riya Joshi", institution: "Fergusson College", points: 140, muns: 5, awards: 1 },
];

const Rankboard = () => {
  const [activeFilter, setActiveFilter] = useState("All-Time");
  const [search, setSearch] = useState("");

  const filtered = delegates.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.institution.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="bg-navy-gradient px-5 pt-5 pb-6">
          <h1 className="text-xl font-serif font-bold text-gold-light mb-1">Rankboard</h1>
          <p className="text-sm text-gold-light/60">Top performing delegates across the platform</p>
        </div>

        {/* Top 3 Podium */}
        <div className="px-4">
          <div className="flex items-end justify-center gap-3 mb-4">
            {[1, 0, 2].map((idx) => {
              const d = delegates[idx];
              const isFirst = idx === 0;
              return (
                <div key={d.rank} className={`flex flex-col items-center ${isFirst ? "order-2" : idx === 1 ? "order-1" : "order-3"}`}>
                  <span className="text-2xl mb-1">{medals[d.rank - 1]}</span>
                  <div className={`${isFirst ? "w-20 h-20" : "w-16 h-16"} rounded-full bg-navy-gradient flex items-center justify-center border-2 border-gold/30 mb-1`}>
                    <span className="text-gold-light font-bold text-lg">{d.name[0]}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground text-center">{d.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground">{d.points} pts</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 flex gap-2">
          {timeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === f
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search delegates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        {/* Full List */}
        <div className="px-4 space-y-2 pb-4">
          {filtered.map((d) => (
            <div
              key={d.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border shadow-card ${
                d.rank <= 3
                  ? "bg-card border-gold/20"
                  : "bg-card border-border"
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                d.rank <= 3
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-muted-foreground"
              }`}>
                {d.rank <= 3 ? medals[d.rank - 1] : `#${d.rank}`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.institution}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{d.points}</p>
                <p className="text-[10px] text-muted-foreground">{d.muns} MUNs · {d.awards} Awards</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Rankboard;
