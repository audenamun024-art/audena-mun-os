import { useState, useEffect } from "react";
import { Calendar, Users, DollarSign, Plus, Edit, Trash2, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Organizer = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({ events: 0, delegates: 0, revenue: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: org } = await supabase.from("organizers").select("id").eq("user_id", user.id).single();
      if (!org) return;

      const { data: evts } = await supabase.from("events").select("*").eq("organizer_id", org.id).order("created_at", { ascending: false });
      setEvents(evts || []);
      setStats({ events: evts?.length || 0, delegates: 0, revenue: 0 });

      // Get registrations for all events
      if (evts && evts.length > 0) {
        const eventIds = evts.map(e => e.id);
        const { data: regs } = await supabase.from("registrations").select("*").in("event_id", eventIds).order("created_at", { ascending: false }).limit(10);
        setApplications(regs || []);
        setStats(prev => ({ ...prev, delegates: regs?.length || 0 }));
      }
    };
    fetch();
  }, []);

  const handleApproveReg = async (id: string) => {
    await supabase.from("registrations").update({ status: "approved" }).eq("id", id);
    setApplications(applications.map(a => a.id === id ? { ...a, status: "approved" } : a));
    toast.success("Registration approved");
  };

  const handleRejectReg = async (id: string) => {
    await supabase.from("registrations").update({ status: "rejected" }).eq("id", id);
    setApplications(applications.map(a => a.id === id ? { ...a, status: "rejected" } : a));
    toast.info("Registration rejected");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-serif text-lg font-bold text-gradient-gold">AudenaMUN</Link>
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">Organizer</span>
        </div>
        <Link to="/events/create">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark text-xs">
            <Plus className="h-4 w-4 mr-1" /> Create Event
          </Button>
        </Link>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Events", value: stats.events, icon: Calendar },
            { label: "Delegates", value: stats.delegates, icon: Users },
            { label: "Revenue", value: `₹${stats.revenue}`, icon: DollarSign },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <s.icon className="h-5 w-5 text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Events */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-serif text-base font-bold text-foreground mb-3">Your Events</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet. Create your first event!</p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{e.title}</h3>
                    <p className="text-xs text-muted-foreground">{e.location} · ₹{e.registration_fee}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    e.status === "open" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                  }`}>{e.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Applications */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-serif text-base font-bold text-foreground mb-3">Recent Applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet</p>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-foreground">{app.full_name}</p>
                    <p className="text-xs text-muted-foreground">{app.email} · {app.institution}</p>
                  </div>
                  {app.status === "pending" ? (
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 w-7 p-0" onClick={() => handleApproveReg(app.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 w-7 p-0" onClick={() => handleRejectReg(app.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                      app.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"
                    }`}>{app.status}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Organizer;
