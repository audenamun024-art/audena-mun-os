import AppLayout from "@/components/layout/AppLayout";
import { Calendar, Users, Trophy, ChevronRight, MapPin, Play, Gavel, Globe, Shield, Award, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const bannerImages = [eventImg1, eventImg2];

const Index = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [topDelegates, setTopDelegates] = useState<any[]>([]);
  const [stats, setStats] = useState({ events: 0, delegates: 0, registrations: 0 });
  const [loading, setLoading] = useState(true);
  const { user, roles, accountType } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const [evRes, profRes, regRes, eventsData, topData] = await Promise.all([
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("registrations").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*").eq("status", "published" as any).order("created_at", { ascending: false }).limit(6),
        supabase.from("profiles").select("*").order("rank_points", { ascending: false }).limit(3),
      ]);
      setStats({ events: evRes.count || 0, delegates: profRes.count || 0, registrations: regRes.count || 0 });
      setEvents(eventsData.data || []);
      setTopDelegates(topData.data || []);
      setLoading(false);
    };
    fetchData();
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
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Welcome Hero */}
        <section className="relative bg-card rounded-2xl border border-border overflow-hidden shadow-card">
          <div className="bg-gradient-primary p-6 md:p-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary-foreground/70 font-semibold mb-2">
              {user ? "Welcome back" : "Welcome to"}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary-foreground mb-2">
              {user?.user_metadata?.full_name || "AudenaMUN"}
            </h1>
            <p className="text-sm text-primary-foreground/80 mb-6">
              {user ? "Your next committee awaits. Stay prepared." : "India's premier Model United Nations platform"}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Calendar, label: "Events", value: loading ? "—" : (stats.events || "24+") },
                { icon: Users, label: "Delegates", value: loading ? "—" : (stats.delegates || "3.2K") },
                { icon: Trophy, label: "Registrations", value: loading ? "—" : (stats.registrations || "180") },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                  <stat.icon className="h-4 w-4 text-primary-foreground/80 mx-auto mb-1" />
                  <p className="text-lg font-bold text-primary-foreground">{stat.value}</p>
                  <p className="text-[10px] text-primary-foreground/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Browse Events", path: "/events", icon: Calendar, color: "bg-primary/10 text-primary" },
            { label: "Buzz Feed", path: "/buzz", icon: Play, color: "bg-accent/10 text-accent" },
            { label: "Rankboard", path: "/rankboard", icon: Trophy, color: "bg-warning/10 text-warning" },
            { label: "Research", path: "/research", icon: Globe, color: "bg-success/10 text-success" },
            ...(roles.has("admin") ? [{ label: "Admin Panel", path: "/admin", icon: Shield, color: "bg-destructive/10 text-destructive" }] : []),
            ...(roles.has("organizer") || accountType === "organisation" ? [{ label: "Organizer", path: "/organizer", icon: Gavel, color: "bg-indigo/10 text-indigo" }] : []),
          ].map((item) => (
            <Link key={item.label} to={item.path} className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elevated transition-all shadow-card group">
              <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
            </Link>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Featured Events */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Upcoming Events</h2>
              <Link to="/events" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline">
                See All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-card">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : (
                displayEvents.slice(0, 4).map((event: any, i: number) => (
                  <Link to={`/events/${event.id}`} key={event.id} className="flex gap-4 bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-elevated transition-all shadow-card group">
                    <img src={event.banner_url || bannerImages[i % 2]} alt={event.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.start_date}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">₹{event.registration_fee}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Top Delegates Sidebar */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Top Delegates</h2>
              <Link to="/rankboard" className="text-xs font-medium text-primary flex items-center gap-0.5 hover:underline">
                Full Board <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-card divide-y divide-border">
              {displayDelegates.map((d: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <span className="text-xl">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.institution}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{d.rank_points} pts</span>
                </div>
              ))}
            </div>

            {!user && (
              <div className="mt-4 bg-card rounded-xl border border-border p-4 shadow-card text-center">
                <p className="text-sm text-muted-foreground mb-3">Join AudenaMUN to participate</p>
                <Link to="/auth">
                  <Button className="bg-gradient-primary text-primary-foreground w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
