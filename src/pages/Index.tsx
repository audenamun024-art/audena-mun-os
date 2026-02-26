import AppLayout from "@/components/layout/AppLayout";
import { Calendar, Users, Trophy, ChevronRight, MapPin, Play, TrendingUp, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/hero-banner.jpg";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";
import buzzImg from "@/assets/buzz-placeholder.jpg";

const bannerImages = [eventImg1, eventImg2];

const Index = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [topDelegates, setTopDelegates] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.from("events").select("*").eq("status", "open").limit(6).then(({ data }) => {
      if (data) setEvents(data);
    });
    supabase.from("profiles").select("*").order("rank_points", { ascending: false }).limit(3).then(({ data }) => {
      if (data) setTopDelegates(data);
    });
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  const displayEvents = events.length > 0 ? events : [
    { id: "1", title: "Delhi International MUN 2026", start_date: "2026-03-15", location: "New Delhi", registration_fee: 1200 },
    { id: "2", title: "Mumbai Model United Nations", start_date: "2026-04-05", location: "Mumbai", registration_fee: 800 },
    { id: "3", title: "National Youth Parliament", start_date: "2026-05-01", location: "Bangalore", registration_fee: 600 },
  ];

  const displayDelegates = topDelegates.length > 0 ? topDelegates : [
    { full_name: "Arjun Mehta", institution: "St. Xavier's", rank_points: 340 },
    { full_name: "Priya Sharma", institution: "Lady Shri Ram", rank_points: 290 },
    { full_name: "Rohan Kapoor", institution: "Hindu College", rank_points: 270 },
  ];

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Hero */}
        <section className="relative h-80 overflow-hidden">
          <img src={heroBanner} alt="AudenaMUN" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-medium mb-2">Welcome to</p>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
              <span className="text-gradient-gold">AudenaMUN</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              India's premier Model United Nations platform
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Calendar, label: "Events", value: "24+" },
                { icon: Users, label: "Delegates", value: "3.2K" },
                { icon: Trophy, label: "Awards", value: "180" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
                  <stat.icon className="h-4 w-4 text-accent mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stories-like quick actions */}
        <section className="px-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { label: "Events", path: "/events", emoji: "🏛" },
              { label: "Buzz", path: "/buzz", emoji: "🎬" },
              { label: "Ranks", path: "/rankboard", emoji: "🏆" },
              { label: "Research", path: "/research", emoji: "🔍" },
              ...(user ? [{ label: "Profile", path: "/profile", emoji: "👤" }] : [{ label: "Join", path: "/auth", emoji: "✨" }]),
            ].map((item) => (
              <Link key={item.label} to={item.path} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/5 border-2 border-accent/40 flex items-center justify-center text-xl hover:scale-105 transition-transform">
                  {item.emoji}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Events - Instagram card style */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-serif font-bold text-foreground">Upcoming Events</h2>
            <Link to="/events" className="text-xs font-medium text-accent flex items-center gap-0.5">
              See All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {displayEvents.slice(0, 3).map((event: any, i: number) => (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className="block bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/30 transition-all"
              >
                <div className="relative h-40">
                  <img src={event.banner_url || bannerImages[i % 2]} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ₹{event.registration_fee}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-foreground mb-1.5">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.start_date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Top Delegates */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-serif font-bold text-foreground">Top Delegates</h2>
            <Link to="/rankboard" className="text-xs font-medium text-accent flex items-center gap-0.5">
              Full Board <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {displayDelegates.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <span className="text-xl">{medals[i]}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">{d.institution}</p>
                </div>
                <span className="text-sm font-bold text-accent">{d.rank_points} pts</span>
              </div>
            ))}
          </div>
        </section>

        {/* Buzz Preview */}
        <section className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-serif font-bold text-foreground">Trending on Buzz</h2>
            <Link to="/buzz" className="text-xs font-medium text-accent flex items-center gap-0.5">
              Watch More <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["Best Speech – UNSC", "Crisis Reaction", "Debate Highlight", "Award Ceremony"].map((title, i) => (
              <Link
                to="/buzz"
                key={i}
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-accent/30 transition-colors"
              >
                <div className="relative h-28">
                  <img src={buzzImg} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{title}</p>
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
