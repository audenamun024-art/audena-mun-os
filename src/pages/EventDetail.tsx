import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Calendar, MapPin, Users, DollarSign, Clock, ChevronRight, Share2
} from "lucide-react";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const eventsData: Record<string, {
  title: string; date: string; location: string; delegates: number;
  fee: string; platformFee: number; committees: { name: string; agenda: string; capacity: number }[];
  description: string; deadline: string; status: string; bannerIdx: number;
}> = {
  "1": {
    title: "Delhi International MUN 2026",
    date: "Mar 15–17, 2026",
    location: "New Delhi",
    delegates: 450,
    fee: "₹1,200",
    platformFee: 25,
    deadline: "Mar 10, 2026",
    status: "Open",
    bannerIdx: 0,
    description: "Join India's most prestigious Model United Nations conference featuring 12 committees, expert chairs, and delegates from across the nation. Three days of intense debate, diplomacy, and networking.",
    committees: [
      { name: "UNSC", agenda: "Addressing Nuclear Proliferation in the Middle East", capacity: 40 },
      { name: "DISEC", agenda: "Regulating Autonomous Weapons Systems", capacity: 50 },
      { name: "WHO", agenda: "Global Pandemic Preparedness Framework", capacity: 45 },
      { name: "UNHRC", agenda: "Protection of Digital Privacy Rights", capacity: 40 },
      { name: "ECOSOC", agenda: "Sustainable Development in Post-Conflict Zones", capacity: 35 },
      { name: "UNEP", agenda: "Carbon Credit Markets and Climate Justice", capacity: 35 },
    ],
  },
  "2": {
    title: "Mumbai Model United Nations",
    date: "Apr 5–7, 2026",
    location: "Mumbai",
    delegates: 320,
    fee: "₹800",
    platformFee: 25,
    deadline: "Mar 30, 2026",
    status: "Open",
    bannerIdx: 1,
    description: "Mumbai's flagship MUN conference returns with expanded committees and an all-new crisis simulation module. Perfect for both beginners and experienced delegates.",
    committees: [
      { name: "UNSC", agenda: "Conflict Resolution in the South China Sea", capacity: 35 },
      { name: "UNGA", agenda: "Reform of International Financial Institutions", capacity: 60 },
      { name: "WHO", agenda: "Mental Health Infrastructure in Developing Nations", capacity: 40 },
      { name: "AIPPM", agenda: "National Education Policy Reform", capacity: 50 },
    ],
  },
};

// Fallback for slug-based or numeric IDs
const getEvent = (id: string) => {
  if (eventsData[id]) return eventsData[id];
  // Check by slug
  for (const key of Object.keys(eventsData)) {
    const slug = eventsData[key].title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (slug === id) return eventsData[key];
  }
  return eventsData["1"]; // fallback
};

const bannerImages = [eventImg1, eventImg2];

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const event = getEvent(id || "1");

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Banner */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={bannerImages[event.bannerIdx % bannerImages.length]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block ${
              event.status === "Open" ? "bg-green-500/20 text-green-300" : "bg-accent/20 text-gold-light"
            }`}>
              {event.status}
            </span>
            <h1 className="text-xl font-serif font-bold text-gold-light">{event.title}</h1>
          </div>
        </div>

        {/* Quick Info */}
        <div className="px-4 grid grid-cols-2 gap-3">
          {[
            { icon: Calendar, label: event.date },
            { icon: MapPin, label: event.location },
            { icon: Users, label: `${event.delegates} delegates` },
            { icon: Clock, label: `Deadline: ${event.deadline}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-card rounded-lg border border-border p-3 shadow-card">
              <item.icon className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <section className="px-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <h2 className="font-serif text-base font-bold text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          </div>
        </section>

        {/* Committees */}
        <section className="px-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <h2 className="font-serif text-base font-bold text-foreground mb-3">Committees</h2>
            <div className="space-y-2">
              {event.committees.map((c, i) => (
                <div key={i} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm text-foreground">{c.name}</h3>
                    <span className="text-xs text-muted-foreground">{c.capacity} seats</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.agenda}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fee Breakdown */}
        <section className="px-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <h2 className="font-serif text-base font-bold text-foreground mb-3">Fee Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registration Fee</span>
                <span className="font-medium text-foreground">{event.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium text-foreground">₹{event.platformFee}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-accent">
                  ₹{parseInt(event.fee.replace(/[^\d]/g, "")) + event.platformFee}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="px-4 pb-6 flex gap-3">
          <Link to={`/events/${id}/register`} className="flex-1">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-medium">
              Register Now
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            import("sonner").then(({ toast }) => toast.success("Link copied!"));
          }}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
