import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Clock, Trophy, ThumbsUp, Play, Flame } from "lucide-react";
import { useState } from "react";

const currentTopic = {
  title: "Should Artificial Intelligence be regulated at the international level?",
  deadline: "Feb 28, 2026",
  totalVotes: 842,
};

const battles = [
  { id: 1, delegate: "Arjun Mehta", institution: "St. Xavier's", position: "For", votes: 312, duration: "0:58", avatar: "AM" },
  { id: 2, delegate: "Priya Sharma", institution: "Lady Shri Ram", position: "Against", votes: 289, duration: "0:54", avatar: "PS" },
  { id: 3, delegate: "Rohan Kapoor", institution: "Hindu College", position: "For", votes: 241, duration: "1:00", avatar: "RK" },
];

const ResolutionBattles = () => {
  const [voted, setVoted] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-serif font-bold text-foreground">Resolution Battles</h1>
          </div>
          <p className="text-sm text-muted-foreground">Weekly debate challenges — vote for the best</p>
        </div>

        {/* Topic */}
        <section className="px-4">
          <div className="bg-card rounded-xl border border-accent/30 p-4 glow-gold">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Ends {currentTopic.deadline}</span>
            </div>
            <h2 className="font-serif text-sm font-bold text-foreground mb-1">This Week's Topic</h2>
            <p className="text-sm text-muted-foreground">"{currentTopic.title}"</p>
            <p className="text-xs text-accent mt-2">{currentTopic.totalVotes} votes</p>
          </div>
        </section>

        {/* Entries */}
        <section className="px-4 space-y-3 pb-4">
          <h2 className="font-serif text-base font-bold text-foreground">Entries</h2>
          {battles.map((b) => (
            <div key={b.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="bg-secondary h-36 flex items-center justify-center relative">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <Play className="h-6 w-6 text-foreground ml-0.5" />
                </div>
                <span className="absolute bottom-3 right-3 bg-black/60 text-foreground text-[10px] px-2 py-0.5 rounded">{b.duration}</span>
                <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  b.position === "For" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}>{b.position}</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-accent/20">
                    <span className="text-accent text-xs font-bold">{b.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{b.delegate}</p>
                    <p className="text-xs text-muted-foreground">{b.institution}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={voted === b.id ? "default" : "outline"}
                  className={`text-xs h-8 ${voted === b.id ? "bg-accent text-accent-foreground" : "border-border"}`}
                  onClick={() => setVoted(b.id)}
                  disabled={voted !== null && voted !== b.id}
                >
                  <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {voted === b.id ? b.votes + 1 : b.votes}
                </Button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppLayout>
  );
};

export default ResolutionBattles;
