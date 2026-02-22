import { useState, useEffect } from "react";
import { Users, Calendar, DollarSign, Shield, AlertTriangle, Globe, TrendingUp, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Admin = () => {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ organizers: 0, events: 0, delegates: 0, revenue: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data: orgs } = await supabase.from("organizers").select("*").eq("status", "pending");
      setOrganizers(orgs || []);
      const { data: evts } = await supabase.from("events").select("*").order("created_at", { ascending: false }).limit(5);
      setEvents(evts || []);
      const { count: orgCount } = await supabase.from("organizers").select("*", { count: "exact", head: true });
      const { count: evtCount } = await supabase.from("events").select("*", { count: "exact", head: true });
      const { count: delCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setStats({ organizers: orgCount || 0, events: evtCount || 0, delegates: delCount || 0, revenue: 0 });
    };
    fetch();
  }, []);

  const handleApprove = async (id: string) => {
    await supabase.from("organizers").update({ status: "approved" }).eq("id", id);
    setOrganizers(organizers.filter(o => o.id !== id));
    toast.success("Organizer approved");
  };

  const handleReject = async (id: string) => {
    await supabase.from("organizers").update({ status: "rejected" }).eq("id", id);
    setOrganizers(organizers.filter(o => o.id !== id));
    toast.info("Organizer rejected");
  };

  const statCards = [
    { label: "Organizers", value: stats.organizers, icon: Users },
    { label: "Events", value: stats.events, icon: Calendar },
    { label: "Delegates", value: stats.delegates, icon: Users },
    { label: "Revenue", value: `₹${stats.revenue}`, icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-serif text-lg font-bold text-gradient-gold">AudenaMUN</Link>
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/research">
            <Button size="sm" variant="ghost" className="text-xs"><Globe className="h-4 w-4 mr-1" /> Research</Button>
          </Link>
          <Link to="/crisis">
            <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs">
              <AlertTriangle className="h-4 w-4 mr-1" /> Crisis
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <s.icon className="h-5 w-5 text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Organizers */}
          <section className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-serif text-base font-bold text-foreground mb-3">Pending Organizers</h2>
            {organizers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            ) : (
              <div className="space-y-2">
                {organizers.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{org.institution_name}</p>
                      <p className="text-xs text-muted-foreground">{org.contact_person} · {org.email}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 w-7 p-0" onClick={() => handleApprove(org.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 w-7 p-0" onClick={() => handleReject(org.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Events */}
          <section className="bg-card rounded-xl border border-border p-4">
            <h2 className="font-serif text-base font-bold text-foreground mb-3">Recent Events</h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-foreground">{e.title}</p>
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
        </div>
      </div>
    </div>
  );
};

export default Admin;
