import AppLayout from "@/components/layout/AppLayout";
import { Calendar, Users, Trophy, ChevronRight, MapPin, Flame, Play, TrendingUp } from "lucide-react";
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

  useEffect(() => {
    supabase.from("events").select("*").eq("status", "open").limit(6).then(({ data }) => {
      if (data) setEvents(data);
    });
    supabase.from("profiles").select("*").order("rank_points", { ascending: false }).limit(3).then(({ data }) => {
      if (data) setTopDelegates(data);
    });
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative h-72 overflow-hidden">
          <img src={heroBanner} alt="AudenaMUN" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-1">
              Welcome to <span className="text-gradient-gold">AudenaMUN</span>
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              India's premier Model UN platform
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

        {/* Featured Events */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-serif font-bold text-foreground">Featured Events</h2>
            <Link to="/events" className="text-xs font-medium text-accent flex items-center gap-0.5">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {(events.length > 0 ? events : [
              { id: "1", title: "Delhi International MUN 2026", start_date: "2026-03-15", location: "New Delhi", registration_fee: 1200 },
              { id: "2", title: "Mumbai Model United Nations", start_date: "2026-04-05", location: "Mumbai", registration_fee: 800 },
              { id: "3", title: "National Youth Parliament", start_date: "2026-05-01", location: "Bangalore", registration_fee: 600 },
            ]).map((event: any, i: number) => (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className="min-w-[240px] snap-start bg-card rounded-xl border border-border overflow-hidden hover:border-accent/30 transition-all"
              >
                <div className="relative h-28">
                  <img src={bannerImages[i % 2]} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">{event.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    {event.location} · {event.start_date}
                  </div>
                  <span className="text-xs font-bold text-accent">₹{event.registration_fee}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Resolution Battles */}
        <section className="px-4">
          <Link to="/resolution-battles" className="block bg-card rounded-xl border border-accent/20 p-4 hover:border-accent/40 transition-colors glow-gold">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-sm text-foreground">Resolution Battles</h3>
                <p className="text-xs text-muted-foreground">Vote on this week's debate topic</p>
              </div>
              <ChevronRight className="h-4 w-4 text-accent" />
            </div>
          </Link>
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
            {(topDelegates.length > 0 ? topDelegates : [
              { full_name: "Arjun Mehta", institution: "St. Xavier's", rank_points: 340 },
              { full_name: "Priya Sharma", institution: "Lady Shri Ram", rank_points: 290 },
              { full_name: "Rohan Kapoor", institution: "Hindu College", rank_points: 270 },
            ]).map((d: any, i: number) => (
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
                <div className="relative h-24">
                  <img src={buzzImg} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div className="p-2">
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
