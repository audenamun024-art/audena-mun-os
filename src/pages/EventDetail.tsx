import AppLayout from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, MapPin, Users, IndianRupee, Sparkles, Share2, Bookmark, ArrowLeft, Building2,
  ChevronDown, Search,
} from "lucide-react";
import CashfreePaymentDialog from "@/components/payments/CashfreePaymentDialog";
import { toast } from "sonner";

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any | null>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [committeesOpen, setCommitteesOpen] = useState(false);
  const [committeeQuery, setCommitteeQuery] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [evRes, comRes, regCountRes] = await Promise.all([
        supabase.from("events" as any).select("*").eq("id", id).maybeSingle(),
        supabase.from("committees" as any).select("*").eq("event_id", id),
        supabase.from("event_registrations" as any).select("id", { count: "exact", head: true }).eq("event_id", id).eq("payment_status", "paid"),
      ]);
      setEvent(evRes.data);
      setCommittees((comRes.data as any[]) || []);
      setRegistrationsCount(regCountRes.count || 0);
      if (user) {
        const { data: myReg } = await supabase.from("event_registrations" as any)
          .select("id").eq("event_id", id).eq("user_id", user.id).eq("payment_status", "paid").maybeSingle();
        setRegistered(!!myReg);
      }
      setLoading(false);
    })();
  }, [id, user?.id]);

  const status = (() => {
    if (!event?.start_date) return "Upcoming";
    const now = Date.now();
    const start = new Date(event.start_date).getTime();
    const end = event.end_date ? new Date(event.end_date).getTime() : start;
    if (now < start) return "Upcoming";
    if (now > end) return "Completed";
    return "Ongoing";
  })();

  const isFree = !event?.fee || Number(event.fee) === 0;
  const totalCapacity = committees.reduce((s, c) => s + Number(c.capacity || 0), 0) || event?.capacity || 0;
  const remaining = Math.max(0, totalCapacity - registrationsCount);
  const filteredCommittees = committees.filter((committee) =>
    !committeeQuery.trim() || `${committee.name}`.toLowerCase().includes(committeeQuery.trim().toLowerCase())
  );

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }); } catch { /* ignore */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  if (loading) {
    return <AppLayout><div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
      <Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-32" />
    </div></AppLayout>;
  }
  if (!event) {
    return <AppLayout><div className="max-w-4xl mx-auto p-12 text-center">
      <p className="font-semibold text-foreground">Event not found</p>
      <Link to="/events" className="text-accent text-sm">← Back to events</Link>
    </div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 md:pb-8 space-y-6">
        <Link to="/events" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All events
        </Link>

        {/* HEADER + BANNER */}
        <div className="rounded-3xl overflow-hidden glass-panel border border-border">
          <div className="aspect-[16/7] bg-gradient-primary relative">
            {event.cover_url ? (
              <img src={event.cover_url} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-white/60" />
              </div>
            )}
            <Badge className="absolute top-4 left-4 bg-background/85 text-foreground backdrop-blur">
              {status}
            </Badge>
          </div>
          <div className="p-5 md:p-7 space-y-3">
            <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground">{event.title}</h1>
            {event.category && (
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> {event.category}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
              {event.start_date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(event.start_date).toLocaleDateString()} {event.end_date && `– ${new Date(event.end_date).toLocaleDateString()}`}</span>}
              {event.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>}
              {totalCapacity > 0 && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{registrationsCount}/{totalCapacity} registered</span>}
            </div>
          </div>
        </div>

        {/* COMMITTEES */}
        {committees.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-display font-bold text-foreground">Committees</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {committees.map((c) => (
                <div key={c.id} className="glass-panel rounded-2xl p-4 border border-border">
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>Capacity: {c.capacity}</span>
                    <span className="text-accent font-semibold">{c.capacity} seats</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REGISTRATION + PRICING */}
        <section className="grid sm:grid-cols-2 gap-3">
          <div className="glass-panel rounded-2xl p-5 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Registration</p>
            <p className="text-2xl font-display font-bold mt-1">{registrationsCount} registered</p>
            {totalCapacity > 0 && <p className="text-xs text-muted-foreground mt-1">{remaining} seats remaining</p>}
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Delegate Fee</p>
            <p className="text-2xl font-display font-bold mt-1 inline-flex items-center">
              {isFree ? "Free" : <><IndianRupee className="h-5 w-5" />{Number(event.fee).toLocaleString()}</>}
            </p>
            {!isFree && <p className="text-[11px] text-muted-foreground mt-1">+ ₹29 platform fee at checkout</p>}
          </div>
        </section>

        {/* DESCRIPTION */}
        {event.description && (
          <section className="space-y-2">
            <h2 className="text-lg font-display font-bold text-foreground">About this event</h2>
            <div className="glass-panel rounded-2xl p-5 border border-border">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{event.description}</p>
            </div>
          </section>
        )}

        {/* DESKTOP ACTIONS */}
        <div className="hidden md:flex gap-3 pt-2">
          {registered ? (
            <Button disabled className="bg-success text-success-foreground rounded-xl flex-1">Registered ✓</Button>
          ) : (
            <Button onClick={() => isFree ? toast.info("Free event — registration coming soon") : setPayOpen(true)}
              className="bg-primary text-primary-foreground rounded-xl flex-1">
              {isFree ? "Register" : "Pay & Register"}
            </Button>
          )}
          <Button variant="outline" onClick={handleShare} className="rounded-xl"><Share2 className="h-4 w-4 mr-1" />Share</Button>
          <Button variant="outline" className="rounded-xl"><Bookmark className="h-4 w-4 mr-1" />Save</Button>
        </div>
      </div>

      {/* STICKY MOBILE ACTION PANEL */}
      <div className="md:hidden fixed bottom-16 inset-x-0 z-40 glass-panel border-t border-border p-3 flex gap-2">
        {registered ? (
          <Button disabled className="bg-success text-success-foreground rounded-xl flex-1">Registered ✓</Button>
        ) : (
          <Button onClick={() => isFree ? toast.info("Free event — registration coming soon") : setPayOpen(true)}
            className="bg-primary text-primary-foreground rounded-xl flex-1">
            {isFree ? "Register" : `Pay ₹${Number(event.fee).toLocaleString()}`}
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={handleShare} className="rounded-xl shrink-0"><Share2 className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="rounded-xl shrink-0"><Bookmark className="h-4 w-4" /></Button>
      </div>

      {payOpen && (
        <CashfreePaymentDialog
          open={payOpen} onClose={() => setPayOpen(false)}
          amount={Number(event.fee)} title={event.title} eventId={event.id}
          purpose={`Event registration: ${event.title}`}
          onSuccess={() => { setRegistered(true); setRegistrationsCount((c) => c + 1); }}
        />
      )}
    </AppLayout>
  );
};

export default EventDetail;
