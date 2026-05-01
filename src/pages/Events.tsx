import AppLayout from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, IndianRupee, Sparkles, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import CashfreePaymentDialog from "@/components/payments/CashfreePaymentDialog";

type EventRow = {
  id: string; title: string; description: string | null; cover_url: string | null;
  location: string | null; start_date: string | null; end_date: string | null;
  fee: number; currency: string; capacity: number | null; category: string | null; status: string;
};

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [payDialog, setPayDialog] = useState<EventRow | null>(null);

  const fetchAll = async () => {
    const { data } = await supabase.from("events" as any).select("*")
      .eq("status", "published").order("start_date", { ascending: true });
    setEvents((data as any[]) || []);
    if (user) {
      const { data: regs } = await supabase.from("event_registrations" as any)
        .select("event_id").eq("user_id", user.id).eq("payment_status", "paid");
      setRegistrations(new Set((regs as any[] || []).map((r) => r.event_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel("events-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = events.filter((e) =>
    !q || `${e.title} ${e.location || ""} ${e.category || ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> MUN Events
            </h1>
            <p className="text-sm text-muted-foreground">Discover and register for upcoming conferences.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events..."
              className="pl-9 h-10 rounded-xl bg-secondary/60" />
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No events listed yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon — admins publish new events from the control center.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((e) => {
              const registered = registrations.has(e.id);
              const isFree = !e.fee || Number(e.fee) === 0;
              return (
                <div key={e.id} className="glass-panel rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-colors">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/30 to-accent/30 relative">
                    {e.cover_url ? (
                      <img src={e.cover_url} alt={e.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-10 w-10 text-white/60" />
                      </div>
                    )}
                    {e.category && (
                      <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full">
                        {e.category}
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-display font-bold text-foreground line-clamp-1">{e.title}</h3>
                    {e.description && <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>}
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
                      {e.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.start_date).toLocaleDateString()}</span>}
                      {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
                      {e.capacity && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.capacity}</span>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                      <span className="text-base font-bold text-foreground flex items-center">
                        {isFree ? "Free" : (<><IndianRupee className="h-4 w-4" />{Number(e.fee).toLocaleString()}</>)}
                      </span>
                      {registered ? (
                        <span className="text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">Registered ✓</span>
                      ) : (
                        <Button size="sm" className="h-8 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground"
                          onClick={() => isFree ? alert("Free event — registration coming soon") : setPayDialog(e)}>
                          {isFree ? "Register" : "Pay & Register"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {payDialog && (
        <CashfreePaymentDialog
          open={!!payDialog}
          onClose={() => setPayDialog(null)}
          amount={Number(payDialog.fee)}
          title={payDialog.title}
          eventId={payDialog.id}
          purpose={`Event registration: ${payDialog.title}`}
          onSuccess={fetchAll}
        />
      )}
    </AppLayout>
  );
};

export default Events;
