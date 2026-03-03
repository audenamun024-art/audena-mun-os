import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign, Clock, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const bannerImages = [eventImg1, eventImg2];

const fallbackEvents: Record<string, any> = {
  "1": {
    title: "Delhi International MUN 2026", start_date: "2026-03-15", end_date: "2026-03-17",
    location: "New Delhi", registration_fee: 1200, platform_fee: 25,
    registration_deadline: "2026-03-10", status: "open",
    description: "Join India's most prestigious Model United Nations conference featuring 12 committees.",
    committees: [
      { name: "UNSC", agenda: "Addressing Nuclear Proliferation", capacity: 40 },
      { name: "DISEC", agenda: "Regulating Autonomous Weapons", capacity: 50 },
      { name: "WHO", agenda: "Global Pandemic Preparedness", capacity: 45 },
    ],
  },
  "2": {
    title: "Mumbai Model United Nations", start_date: "2026-04-05", end_date: "2026-04-07",
    location: "Mumbai", registration_fee: 800, platform_fee: 25,
    registration_deadline: "2026-03-30", status: "open",
    description: "Mumbai's flagship MUN conference with expanded committees.",
    committees: [
      { name: "UNSC", agenda: "Conflict in South China Sea", capacity: 35 },
      { name: "UNGA", agenda: "Reform of Financial Institutions", capacity: 60 },
    ],
  },
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) {
        setEvent(ev);
        const { data: comms } = await supabase.from("committees").select("*").eq("event_id", id);
        setCommittees(comms || []);
      } else {
        // Fallback
        const fb = fallbackEvents[id || "1"] || fallbackEvents["1"];
        setEvent(fb);
        setCommittees(fb.committees || []);
      }
    };
    fetch();
  }, [id]);

  if (!event) return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;

  const fee = event.registration_fee || 0;
  const platformFee = event.platform_fee || 25;

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Banner */}
        <div className="relative h-52 overflow-hidden">
          <img src={event.banner_url || bannerImages[0]} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 inline-block capitalize ${
              event.status === "open" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
            }`}>
              {event.status}
            </span>
            <h1 className="text-xl font-serif font-bold text-foreground">{event.title}</h1>
          </div>
        </div>

        {/* Quick Info */}
        <div className="px-4 grid grid-cols-2 gap-2">
          {[
            { icon: Calendar, label: `${event.start_date} – ${event.end_date}` },
            { icon: MapPin, label: event.location },
            { icon: DollarSign, label: `₹${fee} + ₹${platformFee}` },
            { icon: Clock, label: `Deadline: ${event.registration_deadline || "TBA"}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-card rounded-xl border border-border p-3">
              <item.icon className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs text-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <section className="px-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-serif text-base font-bold text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          </div>
        </section>

        {/* Committees */}
        {committees.length > 0 && (
          <section className="px-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-serif text-base font-bold text-foreground mb-3">Committees</h2>
              <div className="space-y-2">
                {committees.map((c: any, i: number) => (
                  <div key={i} className="bg-secondary rounded-lg p-3">
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
        )}

        {/* Fee Breakdown */}
        <section className="px-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-serif text-base font-bold text-foreground mb-3">Fee Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Registration</span><span className="text-foreground">₹{fee}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span className="text-foreground">₹{platformFee}</span></div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-accent">₹{fee + platformFee}</span>
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
          <Button variant="outline" size="icon" className="border-border" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
          }}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
