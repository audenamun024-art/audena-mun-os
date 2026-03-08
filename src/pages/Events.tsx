import AppLayout from "@/components/layout/AppLayout";
import { Calendar, MapPin, Users, ChevronRight, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const bannerImages = [eventImg1, eventImg2];
const filters = ["All", "published", "draft", "completed"];

const Events = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      let q = supabase.from("events").select("*").order("created_at", { ascending: false });
      if (activeFilter !== "All") q = q.eq("status", activeFilter as any);
      const { data } = await q;
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [activeFilter]);

  const displayEvents = events.length > 0 ? events : [
    { id: "1", title: "Delhi International MUN 2026", start_date: "2026-03-15", end_date: "2026-03-17", location: "New Delhi", registration_fee: 1200, status: "published", description: "A flagship conference bringing together 500+ delegates from across South Asia." },
    { id: "2", title: "Mumbai Model United Nations", start_date: "2026-04-05", end_date: "2026-04-07", location: "Mumbai", registration_fee: 800, status: "published", description: "Western India's largest MUN conference with 8 committees." },
    { id: "3", title: "National Youth Parliament", start_date: "2026-05-01", end_date: "2026-05-03", location: "Bangalore", registration_fee: 600, status: "published", description: "Parliamentary debate simulation for emerging young leaders." },
  ];

  const filtered = displayEvents.filter((e: any) =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Discover MUN conferences across India</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border h-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border capitalize ${
                  activeFilter === f
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Event Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <Skeleton className="w-full h-40 rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((event: any, i: number) => (
              <Link
                to={`/events/${event.id}`}
                key={event.id}
                className="group bg-card rounded-xl border border-border overflow-hidden hover:border-foreground/10 transition-all shadow-card hover:shadow-elevated"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={event.banner_url || bannerImages[i % 2]}
                    alt={event.title}
                    className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize backdrop-blur-md ${
                      event.status === "published"
                        ? "bg-success/20 text-success"
                        : "bg-secondary/80 text-muted-foreground"
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-[15px] mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />{event.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />{formatDate(event.start_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm font-bold text-foreground">₹{event.registration_fee}</span>
                    <span className="text-xs font-medium text-primary flex items-center gap-0.5 group-hover:underline">
                      View Details <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events found</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Events;
