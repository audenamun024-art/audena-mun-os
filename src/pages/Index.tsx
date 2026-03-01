import AppLayout from "@/components/layout/AppLayout";
import { Calendar, Users, Trophy, ChevronRight, MapPin, Play, Gavel, Globe, BookOpen, Shield, Award } from "lucide-react";
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
  const [stats, setStats] = useState({ events: 0, delegates: 0, awards: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Fetch real stats
    Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("status", "approved"),
    ]).then(([evRes, profRes, regRes]) => {
      setStats({
        events: evRes.count || 0,
        delegates: profRes.count || 0,
        awards: regRes.count || 0,
      });
    });

    supabase.from("events").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(6).then(({ data }) => {
      if (data) setEvents(data);
    });
    supabase.from("profiles").select("*").order("rank_points", { ascending: false }).limit(3).then(({ data }) => {
      if (data) setTopDelegates(data);
    });
  }, []);

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

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Hero */}
        <section className="relative h-80 overflow-hidden">
          <img src={heroBanner} alt="AudenaMUN Conference" className="w-full h-full object-cover" />
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
                { icon: Calendar, label: "Events", value: stats.events || "24+" },
                { icon: Users, label: "Delegates", value: stats.delegates || "3.2K" },
                { icon: Trophy, label: "Registrations", value: stats.awards || "180" },
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

        {/* Quick Actions */}
        <section className="px-4">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {[
              { label: "Events", path: "/events", icon: Calendar },
              { label: "Buzz", path: "/buzz", icon: Play },
              { label: "Ranks", path: "/rankboard", icon: Trophy },
              { label: "Research", path: "/research", icon: Globe },
              { label: "Admin", path: "/admin", icon: Shield },
              { label: "Organizer", path: "/organizer", icon: Gavel },
              ...(user ? [{ label: "Profile", path: "/profile", icon: Users }] : [{ label: "Join", path: "/auth", icon: Award }]),
            ].map((item) => (
              <Link key={item.label} to={item.path} className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/5 border-2 border-accent/40 flex items-center justify-center hover:scale-105 transition-transform">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Events */}
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
