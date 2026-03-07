import { useState, useEffect } from "react";
import { Calendar, Users, Banknote, Plus, Check, X, Shield, UserPlus, UserMinus, ArrowLeft, FileSpreadsheet, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Organizer = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [ebMembers, setEbMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ events: 0, delegates: 0, revenue: 0 });
  const [activeTab, setActiveTab] = useState<"events" | "applications" | "eb">("events");
  const [ebEmail, setEbEmail] = useState("");
  const [ebEventId, setEbEventId] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: org } = await supabase.from("organizers").select("*").eq("user_id", user.id).maybeSingle();
      if (!org) { navigate("/organizer/register"); return; }

      const { data: evts } = await supabase.from("events").select("*").eq("organizer_id", org.id).order("created_at", { ascending: false });
      setEvents(evts || []);

      if (evts && evts.length > 0) {
        const eventIds = evts.map((e: any) => e.id);
        const { data: regs } = await supabase.from("registrations").select("*").in("event_id", eventIds).order("created_at", { ascending: false });
        setApplications(regs || []);

        const { data: txns } = await supabase.from("transactions").select("amount, status");
        const totalRev = (txns || []).filter((t: any) => t.status === "completed").reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        setStats({ events: evts.length, delegates: regs?.length || 0, revenue: totalRev });

        const { data: eb } = await supabase.from("eb_access").select("*").in("event_id", eventIds);
        setEbMembers(eb || []);
      } else {
        setStats({ events: 0, delegates: 0, revenue: 0 });
      }
    };
    fetch();
  }, []);

  const handleApproveReg = async (id: string) => {
    await supabase.from("registrations").update({ status: "approved" as any }).eq("id", id);
    setApplications(applications.map(a => a.id === id ? { ...a, status: "approved" } : a));
    toast.success("Registration approved");
  };

  const handleRejectReg = async (id: string) => {
    await supabase.from("registrations").update({ status: "rejected" as any }).eq("id", id);
    setApplications(applications.map(a => a.id === id ? { ...a, status: "rejected" } : a));
    toast.info("Registration rejected");
  };

  const handleGrantEB = async () => {
    if (!ebEmail || !ebEventId) { toast.error("Select event and enter delegate name"); return; }
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("full_name", ebEmail).maybeSingle();
    if (!profile) { toast.error("User not found"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("eb_access").insert([{ user_id: (profile as any).user_id, event_id: ebEventId, granted_by: user.id }]);
    if (error) { toast.error(error.message); return; }
    await supabase.from("user_roles").insert([{ user_id: (profile as any).user_id, role: "eb" as any }]);
    toast.success("EB access granted");
    setEbEmail("");
  };

  const handleRevokeEB = async (id: string) => {
    await supabase.from("eb_access").delete().eq("id", id);
    setEbMembers(ebMembers.filter(e => e.id !== id));
    toast.success("EB access revoked");
  };

  const exportCSV = () => {
    if (applications.length === 0) { toast.info("No data to export"); return; }
    const headers = ["Status", "Committee", "Country", "Date"];
    const rows = applications.map((a: any) => [a.status, a.committee_id, a.country_preference, a.created_at]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "registrations.csv"; a.click();
    toast.success("CSV exported");
  };

  const tabs = [
    { key: "events", label: "My Events", icon: Calendar },
    { key: "applications", label: `Applications (${applications.filter(a => a.status === "pending").length})`, icon: Users },
    { key: "eb", label: "EB System", icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/"><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-lg font-bold text-foreground">Organizer</h1>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="text-xs h-8" onClick={exportCSV}><FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Export</Button>
          <Link to="/events/create"><Button size="sm" className="bg-gradient-primary text-primary-foreground text-xs h-8"><Plus className="h-3.5 w-3.5 mr-1" /> New Event</Button></Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Events", value: stats.events, icon: Calendar },
            { label: "Delegates", value: stats.delegates, icon: Users },
            { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Banknote },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <s.icon className="h-5 w-5 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex bg-secondary rounded-xl p-1">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}><tab.icon className="h-3.5 w-3.5" />{tab.label}</button>
          ))}
        </div>

        {activeTab === "events" && (
          <section className="space-y-2 animate-fade-in">
            {events.length === 0 ? (
              <div className="text-center py-12"><Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground mb-3">No events yet</p><Link to="/events/create"><Button size="sm" className="bg-gradient-primary text-primary-foreground">Create First Event</Button></Link></div>
            ) : events.map((e: any) => (
              <Link to={`/events/${e.id}`} key={e.id} className="block">
                <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-card hover:border-primary/20 transition-colors">
                  <div><h3 className="font-semibold text-sm text-foreground">{e.title}</h3><p className="text-xs text-muted-foreground">{e.location} · {e.start_date}</p></div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${e.status === "published" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>{e.status}</span>
                </div>
              </Link>
            ))}
          </section>
        )}

        {activeTab === "applications" && (
          <section className="space-y-2 animate-fade-in">
            {applications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No applications yet</p> : applications.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-card">
                <div><p className="font-medium text-sm text-foreground">Delegate Registration</p><p className="text-xs text-muted-foreground">Committee: {app.committee_id || "Any"} · {app.country_preference || "No preference"}</p></div>
                {app.status === "pending" ? (
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-success text-primary-foreground h-7 w-7 p-0" onClick={() => handleApproveReg(app.id)}><Check className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 w-7 p-0" onClick={() => handleRejectReg(app.id)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${app.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{app.status}</span>
                )}
              </div>
            ))}
          </section>
        )}

        {activeTab === "eb" && (
          <section className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl border border-border p-5 shadow-card space-y-3">
              <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold text-foreground">Grant EB Access</h3></div>
              <p className="text-xs text-muted-foreground">EB members get temporary access to Crisis Mode, Admin tools, and exports.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Select Event</Label>
                  <select value={ebEventId} onChange={(e) => setEbEventId(e.target.value)} className="mt-1 w-full h-9 rounded-lg bg-secondary border border-border text-foreground text-sm px-3">
                    <option value="">Choose event...</option>
                    {events.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Delegate Name</Label><Input value={ebEmail} onChange={(e) => setEbEmail(e.target.value)} placeholder="Enter delegate name" className="mt-1 bg-secondary border-border h-9" /></div>
              </div>
              <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={handleGrantEB}><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Grant Access</Button>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Active EB Members</h3>
              {ebMembers.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">No active EB members</p> : ebMembers.map((eb: any) => (
                <div key={eb.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border shadow-card mb-2">
                  <div><p className="text-sm font-medium text-foreground">EB Member</p><p className="text-[10px] text-muted-foreground">Granted: {new Date(eb.created_at).toLocaleDateString()}</p></div>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 text-xs" onClick={() => handleRevokeEB(eb.id)}><UserMinus className="h-3 w-3 mr-1" /> Revoke</Button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Organizer;
