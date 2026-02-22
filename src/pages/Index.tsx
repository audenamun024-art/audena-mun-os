import AppLayout from "@/components/layout/AppLayout";
import { Calendar, Users, TrendingUp, Trophy, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const featuredEvents = [
  { id: 1, title: "Delhi International MUN 2026", date: "Mar 15–17", location: "New Delhi", delegates: 450, fee: "₹1,200" },
  { id: 2, title: "Mumbai Model United Nations", date: "Apr 5–7", location: "Mumbai", delegates: 320, fee: "₹800" },
  { id: 3, title: "National Youth Parliament", date: "May 1–3", location: "Bangalore", delegates: 280, fee: "₹600" },
];

const upcomingEvents = [
  { id: 4, title: "Kolkata MUN Conference", date: "Jun 12–14", location: "Kolkata", committees: 8 },
  { id: 5, title: "Chennai Diplomacy Summit", date: "Jul 20–22", location: "Chennai", committees: 6 },
  { id: 6, title: "Hyderabad Global Affairs MUN", date: "Aug 8–10", location: "Hyderabad", committees: 10 },
];

const topDelegates = [
  { name: "Arjun Mehta", institution: "St. Xavier's", points: 340, rank: 1 },
  { name: "Priya Sharma", institution: "Lady Shri Ram", points: 290, rank: 2 },
  { name: "Rohan Kapoor", institution: "Hindu College", points: 270, rank: 3 },
];

const medals = ["🥇", "🥈", "🥉"];

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <section className="bg-navy-gradient px-5 pt-6 pb-8">
          <h1 className="text-2xl font-serif font-bold text-gold-light mb-2">
            Welcome to AudenaMUN
          </h1>
          <p className="text-sm text-gold-light/70 mb-5 leading-relaxed">
            India's premier Model UN platform. Discover events, compete, and rise through the ranks.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Calendar, label: "Events", value: "24+" },
              { icon: Users, label: "Delegates", value: "3.2K" },
              { icon: Trophy, label: "Awards", value: "180" },
            ].map((stat) => (
              <div key={stat.label} className="bg-navy-light/50 rounded-lg p-3 text-center border border-gold/10">
                <stat.icon className="h-4 w-4 text-gold mx-auto mb-1" />
                <p className="text-lg font-bold text-gold-light">{stat.value}</p>
                <p className="text-[10px] text-gold-light/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Events */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-serif font-bold text-foreground">Featured Events</h2>
            <Link to="/events" className="text-xs font-medium text-accent flex items-center gap-0.5">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {featuredEvents.map((event) => (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className="min-w-[260px] snap-start bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="bg-navy-gradient rounded-lg h-28 mb-3 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-gold/40" />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">{event.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="h-3 w-3" />
                  {event.location} · {event.date}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{event.delegates} delegates</span>
                  <span className="text-xs font-bold text-accent">{event.fee}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="px-4">
          <h2 className="text-lg font-serif font-bold text-foreground mb-3">Upcoming Events</h2>
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="bg-navy-gradient rounded-lg h-12 w-12 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-gold/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">{event.location} · {event.date}</p>
                </div>
                <span className="text-xs text-accent font-medium shrink-0">{event.committees} Committees</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Rankboard Snapshot */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-serif font-bold text-foreground">Top Delegates</h2>
            <Link to="/rankboard" className="text-xs font-medium text-accent flex items-center gap-0.5">
              Full Board <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {topDelegates.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border shadow-card"
              >
                <span className="text-xl">{medals[i]}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.institution}</p>
                </div>
                <span className="text-sm font-bold text-accent">{d.points} pts</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buzz Preview */}
        <section className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-serif font-bold text-foreground">Trending on Buzz</h2>
            <Link to="/buzz" className="text-xs font-medium text-accent flex items-center gap-0.5">
              Watch More <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Best Speech – UNSC", "Crisis Reaction – DISEC", "Debate Highlight", "Award Ceremony"].map((title, i) => (
              <Link
                to="/buzz"
                key={i}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="bg-navy-gradient h-24 flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{title}</p>
                  <p className="text-[10px] text-muted-foreground">{(i + 1) * 234} views</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
