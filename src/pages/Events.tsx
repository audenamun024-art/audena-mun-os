import AppLayout from "@/components/layout/AppLayout";
import { Calendar, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const allEvents = [
  { id: 1, title: "Delhi International MUN 2026", date: "Mar 15–17, 2026", location: "New Delhi", delegates: 450, fee: "₹1,200", committees: 12, status: "Open", img: eventImg1 },
  { id: 2, title: "Mumbai Model United Nations", date: "Apr 5–7, 2026", location: "Mumbai", delegates: 320, fee: "₹800", committees: 8, status: "Open", img: eventImg2 },
  { id: 3, title: "National Youth Parliament", date: "May 1–3, 2026", location: "Bangalore", delegates: 280, fee: "₹600", committees: 6, status: "Open", img: eventImg1 },
  { id: 4, title: "Kolkata MUN Conference", date: "Jun 12–14, 2026", location: "Kolkata", delegates: 200, fee: "₹500", committees: 8, status: "Upcoming", img: eventImg2 },
  { id: 5, title: "Chennai Diplomacy Summit", date: "Jul 20–22, 2026", location: "Chennai", delegates: 180, fee: "₹700", committees: 6, status: "Upcoming", img: eventImg1 },
  { id: 6, title: "Hyderabad Global Affairs MUN", date: "Aug 8–10, 2026", location: "Hyderabad", delegates: 350, fee: "₹900", committees: 10, status: "Upcoming", img: eventImg2 },
];

const filters = ["All", "Open", "Upcoming", "Closed"];

const Events = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const filtered = activeFilter === "All" ? allEvents : allEvents.filter((e) => e.status === activeFilter);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="bg-navy-gradient px-5 pt-5 pb-6">
          <h1 className="text-xl font-serif font-bold text-gold-light mb-1">Events</h1>
          <p className="text-sm text-gold-light/60">Discover and register for MUN conferences across India</p>
        </div>

        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-3 pb-4">
          {filtered.map((event) => (
            <Link
              to={`/events/${event.id}`}
              key={event.id}
              className="block bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-elevated transition-shadow"
            >
              <img src={event.img} alt={event.title} className="w-full h-32 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground flex-1">{event.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 ${
                    event.status === "Open" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.delegates} delegates</span>
                    <span>{event.committees} committees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-accent">{event.fee}</span>
                    <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark text-xs h-7 px-3">
                      Register
                    </Button>
                  </div>
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
