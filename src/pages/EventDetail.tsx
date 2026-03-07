import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const bannerImages = [eventImg1, eventImg2];
const fallbackEvents: Record<string, any> = {
  "1": { title: "Delhi International MUN 2026", start_date: "2026-03-15", end_date: "2026-03-17", location: "New Delhi", registration_fee: 1200, platform_fee: 25, status: "published", description: "India's most prestigious MUN conference.", committees: [{ name: "UNSC", agenda: "Nuclear Proliferation", capacity: 40 }, { name: "DISEC", agenda: "Autonomous Weapons", capacity: 50 }] },
  "2": { title: "Mumbai Model United Nations", start_date: "2026-04-05", end_date: "2026-04-07", location: "Mumbai", registration_fee: 800, platform_fee: 25, status: "published", description: "Mumbai's flagship MUN.", committees: [{ name: "UNSC", agenda: "South China Sea", capacity: 35 }] },
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) { setEvent(ev); const { data: comms } = await supabase.from("committees").select("*").eq("event_id", id); setCommittees(comms || []); }
      else { const fb = fallbackEvents[id || "1"] || fallbackEvents["1"]; setEvent(fb); setCommittees(fb.committees || []); }
    };
    fetch();
  }, [id]);

  if (!event) return <AppLayout><div className="p-8 text-center text-muted-foreground">Loading...</div></AppLayout>;
  const fee = event.registration_fee || 0;
  const platformFee = event.platform_fee || 25;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="relative h-52 overflow-hidden">
          <img src={event.banner_url || bannerImages[0]} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 inline-block capitalize ${event.status === "published" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>{event.status}</span>
            <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
          </div>
        </div>

        <div className="px-4 grid grid-cols-2 gap-2">
          {[
            { icon: Calendar, label: `${event.start_date} – ${event.end_date}` },
            { icon: MapPin, label: event.location },
            { icon: DollarSign, label: `₹${fee} + ₹${platformFee}` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-card rounded-xl border border-border p-3 shadow-card"><item.icon className="h-4 w-4 text-primary shrink-0" /><span className="text-xs text-foreground">{item.label}</span></div>
          ))}
        </div>

        <section className="px-4"><div className="bg-card rounded-xl border border-border p-4 shadow-card"><h2 className="text-base font-bold text-foreground mb-2">About</h2><p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p></div></section>

        {committees.length > 0 && (
          <section className="px-4"><div className="bg-card rounded-xl border border-border p-4 shadow-card"><h2 className="text-base font-bold text-foreground mb-3">Committees</h2><div className="space-y-2">
            {committees.map((c: any, i: number) => (<div key={i} className="bg-secondary rounded-lg p-3"><div className="flex items-center justify-between mb-1"><h3 className="font-semibold text-sm text-foreground">{c.name}</h3><span className="text-xs text-muted-foreground">{c.capacity} seats</span></div><p className="text-xs text-muted-foreground">{c.agenda}</p></div>))}
          </div></div></section>
        )}

        <section className="px-4"><div className="bg-card rounded-xl border border-border p-4 shadow-card"><h2 className="text-base font-bold text-foreground mb-3">Fee Breakdown</h2><div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Registration</span><span>₹{fee}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
          <div className="flex justify-between border-t border-border pt-2"><span className="font-semibold">Total</span><span className="font-bold text-primary">₹{fee + platformFee}</span></div>
        </div></div></section>

        <div className="px-4 pb-6 flex gap-3">
          <Link to={`/events/${id}/register`} className="flex-1"><Button className="w-full bg-gradient-primary text-primary-foreground font-medium">Register Now</Button></Link>
          <Button variant="outline" size="icon" className="border-border" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}><Share2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventDetail;
