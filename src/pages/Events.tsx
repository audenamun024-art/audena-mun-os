import AppLayout from "@/components/layout/AppLayout";
import { Calendar, MapPin, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const bannerImages = [eventImg1, eventImg2];
const filters = ["All", "open", "draft", "closed"];

const Events = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      let q = supabase.from("events").select("*").order("created_at", { ascending: false });
      if (activeFilter !== "All") q = q.eq("status", activeFilter);
      const { data } = await q;
      setEvents(data || []);
    };
    fetchEvents();
  }, [activeFilter]);

  // Fallback mock data if DB is empty
  const displayEvents = events.length > 0 ? events : [
    { id: "1", title: "Delhi International MUN 2026", start_date: "2026-03-15", end_date: "2026-03-17", location: "New Delhi", registration_fee: 1200, status: "open" },
    { id: "2", title: "Mumbai Model United Nations", start_date: "2026-04-05", end_date: "2026-04-07", location: "Mumbai", registration_fee: 800, status: "open" },
    { id: "3", title: "National Youth Parliament", start_date: "2026-05-01", end_date: "2026-05-03", location: "Bangalore", registration_fee: 600, status: "open" },
  ];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-xl font-serif font-bold text-foreground mb-1">Events</h1>
          <p className="text-sm text-muted-foreground">Discover MUN conferences across India</p>
        </div>

        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                  activeFilter === f
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-3 pb-4">
          {displayEvents.map((event: any, i: number) => (
            <Link
              to={`/events/${event.id}`}
              key={event.id}
              className="block bg-card rounded-xl border border-border overflow-hidden hover:border-accent/30 transition-colors"
            >
              <img src={bannerImages[i % 2]} alt={event.title} className="w-full h-36 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground flex-1">{event.title}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ml-2 capitalize ${
                    event.status === "open" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                  }`}>
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.start_date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-accent">₹{event.registration_fee}</span>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark text-xs h-7 px-3">
                    Register
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Events;
