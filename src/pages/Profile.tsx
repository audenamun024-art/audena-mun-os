import AppLayout from "@/components/layout/AppLayout";
import { Trophy, Calendar, Award, Edit, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const badges = ["🏅 Best Delegate", "⭐ Rising Star", "🎯 Top Speaker", "📚 Research Pro"];

const muns = [
  { title: "Delhi International MUN", date: "Jan 2026", committee: "UNSC", award: "Best Delegate" },
  { title: "Mumbai Model UN", date: "Nov 2025", committee: "DISEC", award: "High Commendation" },
  { title: "National Youth MUN", date: "Sep 2025", committee: "WHO", award: "Special Mention" },
];

const Profile = () => {
  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-navy-gradient px-5 pt-6 pb-8 text-center">
          <div className="w-20 h-20 rounded-full bg-navy-light border-2 border-gold/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-gold-light text-2xl font-serif font-bold">AM</span>
          </div>
          <h1 className="text-lg font-serif font-bold text-gold-light">Arjun Mehta</h1>
          <p className="text-sm text-gold-light/60">St. Xavier's College, Mumbai</p>
          <div className="flex justify-center gap-6 mt-4">
            {[
              { label: "MUNs", value: "12" },
              { label: "Awards", value: "5" },
              { label: "Rank Points", value: "340" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-gold-light">{s.value}</p>
                <p className="text-[10px] text-gold-light/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 flex gap-2">
          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-gold-dark" size="sm">
            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
          </Button>
          <Button variant="outline" className="flex-1" size="sm">
            <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
          </Button>
        </div>

        {/* Badges */}
        <section className="px-4">
          <h2 className="text-base font-serif font-bold text-foreground mb-2">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            {badges.map((b) => (
              <span key={b} className="bg-accent/10 text-accent text-xs font-medium px-3 py-1.5 rounded-full border border-accent/20">
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* MUN History */}
        <section className="px-4 pb-4">
          <h2 className="text-base font-serif font-bold text-foreground mb-2">MUN History</h2>
          <div className="space-y-2">
            {muns.map((m, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{m.title}</h3>
                    <p className="text-xs text-muted-foreground">{m.committee} · {m.date}</p>
                  </div>
                  <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> {m.award}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sign Out */}
        <div className="px-4 pb-6">
          <Link to="/auth">
            <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/5">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
