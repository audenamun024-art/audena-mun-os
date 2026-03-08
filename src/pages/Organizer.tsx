import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users, Calendar, Banknote, Plus, Check, X, Shield, UserPlus, UserMinus,
  FileSpreadsheet, BarChart3, ClipboardList, Eye, TrendingUp, Clock,
  MapPin, ArrowUpRight, ChevronRight, Download, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Organizer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organizer, setOrganizer] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [ebMembers, setEbMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({ events: 0, delegates: 0, revenue: 0, pending: 0, approved: 0 });
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "applications" | "eb">("overview");
  const [ebEmail, setEbEmail] = useState("");
  const [ebEventId, setEbEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [appFilter, setAppFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { navigate("/auth"); return; }
      const { data: org } = await supabase.from("organizers").select("*").eq("user_id", user.id).maybeSingle();
      if (!org) { navigate("/organizer/register"); return; }
      setOrganizer(org);

      const { data: evts } = await supabase.from("events").select("*").eq("organizer_id", org.id).order("created_at", { ascending: false });
      setEvents(evts || []);

      if (evts && evts.length > 0) {
        const eventIds = evts.map((e: any) => e.id);
        const [{ data: regs }, { data: txns }, { data: eb }] = await Promise.all([
          supabase.from("registrations").select("*").in("event_id", eventIds).order("created_at", { ascending: false }),
          supabase.from("transactions").select("amount, status"),
          supabase.from("eb_access").select("*").in("event_id", eventIds),
        ]);
        setApplications(regs || []);
        const pending = (regs || []).filter((r: any) => r.status === "pending").length;
        const approved = (regs || []).filter((r: any) => r.status === "approved").length;
        const totalRev = (txns || []).filter((t: any) => t.status === "completed").reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
        setStats({ events: evts.length, delegates: regs?.length || 0, revenue: totalRev, pending, approved });
        setEbMembers(eb || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleApproveReg = async (id: string) => {
    await supabase.from("registrations").update({ status: "approved" as any }).eq("id", id);
    setApplications(applications.map(a => a.id === id ? { ...a, status: "approved" } : a));
    setStats(s => ({ ...s, pending: s.pending - 1, approved: s.approved + 1 }));
    toast.success("Registration approved");
  };

  const handleRejectReg = async (id: string) => {
    await supabase.from("registrations").update({ status: "rejected" as any }).eq("id", id);
    setApplications(applications.map(a => a.id === id ? { ...a, status: "rejected" } : a));
    setStats(s => ({ ...s, pending: s.pending - 1 }));
    toast.info("Registration rejected");
  };

  const handleGrantEB = async () => {
    if (!ebEmail || !ebEventId) { toast.error("Select event and enter delegate name"); return; }
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("full_name", ebEmail).maybeSingle();
    if (!profile) { toast.error("User not found"); return; }
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
    const headers = ["Status", "Committee", "Country", "Experience", "Date"];
    const rows = applications.map((a: any) => [a.status, a.committee_id || "Any", a.country_preference || "None", a.experience || "N/A", a.created_at]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "registrations.csv"; a.click();
    toast.success("CSV exported");
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
    catch { return d; }
  };

  const filteredApps = appFilter === "all" ? applications : applications.filter(a => a.status === appFilter);

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "events", label: "My Events", icon: Calendar },
    { key: "applications", label: "Applications", icon: ClipboardList, badge: stats.pending },
    { key: "eb", label: "EB System", icon: Shield },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">{(organizer?.name || "O")[0].toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Organizer Dashboard</h1>
                <p className="text-sm text-muted-foreground">{organizer?.name || "Manage your MUN events"}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-xs h-9 border-border gap-1.5" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Link to="/events/create">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground text-xs h-9 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Events", value: stats.events, icon: Calendar, color: "text-primary", bg: "bg-primary/8" },
            { label: "Registrations", value: stats.delegates, icon: Users, color: "text-accent", bg: "bg-accent/8" },
            { label: "Approved", value: stats.approved, icon: Check, color: "text-success", bg: "bg-success/8" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning/8" },
            { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Banknote, color: "text-success", bg: "bg-success/8" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 shadow-card hover:shadow-elevated transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">
                {loading ? <Skeleton className="h-7 w-16" /> : s.value}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-secondary/60 rounded-2xl p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {"badge" in tab && (tab as any).badge > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-warning/15 text-warning text-[10px] font-bold flex items-center justify-center">
                  {(tab as any).badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
            {/* Pending Applications */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" /> Pending Applications
                </h2>
                {stats.pending > 0 && (
                  <button onClick={() => setActiveTab("applications")} className="text-[11px] text-primary font-medium hover:underline flex items-center gap-0.5">
                    View all <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              {applications.filter(a => a.status === "pending").length === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-8 w-8 text-success/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up — no pending applications</p>
                </div>
              ) : applications.filter(a => a.status === "pending").slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3.5 bg-secondary/50 rounded-xl mb-2 last:mb-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground">Delegate Application</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {app.country_preference || "No preference"} · {app.experience || "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <Button size="sm" className="bg-success hover:bg-success/90 text-primary-foreground h-8 w-8 p-0 rounded-lg" onClick={() => handleApproveReg(app.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20 h-8 w-8 p-0 rounded-lg hover:bg-destructive/5" onClick={() => handleRejectReg(app.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Events */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" /> Your Events
                </h2>
                <Link to="/events/create" className="text-[11px] text-primary font-medium hover:underline flex items-center gap-0.5">
                  Create <Plus className="h-3 w-3" />
                </Link>
              </div>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No events created yet</p>
                  <Link to="/events/create">
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground text-xs">Create Event</Button>
                  </Link>
                </div>
              ) : events.slice(0, 4).map((e) => (
                <Link to={`/events/${e.id}`} key={e.id} className="flex items-center justify-between p-3.5 bg-secondary/50 rounded-xl mb-2 last:mb-0 hover:bg-secondary/80 transition-colors group">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3 w-3" />{e.location || "TBD"}
                      {e.start_date && <><span>·</span>{formatDate(e.start_date)}</>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                    e.status === "published" ? "bg-success/10 text-success" :
                    e.status === "draft" ? "bg-secondary text-muted-foreground" :
                    "bg-destructive/10 text-destructive"
                  }`}>{e.status}</span>
                </Link>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-card">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" /> Performance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-secondary/40 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">{stats.events}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Events Created</p>
                </div>
                <div className="text-center p-4 bg-secondary/40 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">{stats.delegates}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Total Applications</p>
                </div>
                <div className="text-center p-4 bg-secondary/40 rounded-xl">
                  <p className="text-2xl font-bold text-success">{stats.approved}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Approved</p>
                </div>
                <div className="text-center p-4 bg-secondary/40 rounded-xl">
                  <p className="text-2xl font-bold text-foreground">₹{stats.revenue.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Total Revenue</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-3 animate-fade-in">
            {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) :
            events.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">You haven't created any events yet</p>
                <Link to="/events/create"><Button size="sm" className="bg-gradient-primary text-primary-foreground">Create First Event</Button></Link>
              </div>
            ) : events.map((e: any) => (
              <Link to={`/events/${e.id}`} key={e.id} className="block group">
                <div className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border shadow-card hover:border-primary/20 hover:shadow-elevated transition-all">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{e.title}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="h-3 w-3" />{e.location || "TBD"}
                      <span>·</span>₹{e.registration_fee || 0}
                      {e.start_date && <><span>·</span>{formatDate(e.start_date)}</>}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                    e.status === "published" ? "bg-success/10 text-success" :
                    e.status === "draft" ? "bg-secondary text-muted-foreground" :
                    "bg-destructive/10 text-destructive"
                  }`}>{e.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 overflow-x-auto">
              {["all", "pending", "approved", "rejected"].map(f => (
                <button key={f} onClick={() => setAppFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all capitalize ${
                    appFilter === f ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>{f} {f === "pending" && stats.pending > 0 ? `(${stats.pending})` : ""}</button>
              ))}
            </div>
            {filteredApps.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border">
                <ClipboardList className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No {appFilter === "all" ? "" : appFilter} applications</p>
              </div>
            ) : filteredApps.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-5 bg-card rounded-2xl border border-border shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground">Delegate Registration</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Committee: {app.committee_id || "Any"} · Country: {app.country_preference || "No preference"}
                    {app.experience && ` · Exp: ${app.experience}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {app.created_at && formatDate(app.created_at)}
                  </p>
                </div>
                {app.status === "pending" ? (
                  <div className="flex gap-1.5 ml-3">
                    <Button size="sm" className="bg-success text-primary-foreground h-8 px-3 text-xs rounded-lg gap-1" onClick={() => handleApproveReg(app.id)}>
                      <Check className="h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20 h-8 px-3 text-xs rounded-lg" onClick={() => handleRejectReg(app.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full capitalize font-semibold ${
                    app.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}>{app.status}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EB System Tab */}
        {activeTab === "eb" && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Grant EB Access</h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Executive Board members get temporary elevated access for crisis management, delegate monitoring, and live session tools.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-medium">Select Event</Label>
                  <select value={ebEventId} onChange={(e) => setEbEventId(e.target.value)}
                    className="mt-1.5 w-full h-10 rounded-xl bg-secondary border border-border text-foreground text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Choose event...</option>
                    {events.map((e: any) => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground font-medium">Delegate Name</Label>
                  <Input value={ebEmail} onChange={(e) => setEbEmail(e.target.value)} placeholder="Enter full name" className="mt-1.5 bg-secondary border-border h-10 rounded-xl" />
                </div>
              </div>
              <Button size="sm" className="bg-gradient-primary text-primary-foreground mt-4 gap-1.5 h-9" onClick={handleGrantEB}>
                <UserPlus className="h-3.5 w-3.5" /> Grant Access
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">Active EB Members</h3>
              {ebMembers.length === 0 ? (
                <div className="text-center py-10 bg-card rounded-2xl border border-border">
                  <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No active EB members</p>
                </div>
              ) : ebMembers.map((eb: any) => (
                <div key={eb.id} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border shadow-card mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">EB Member</p>
                      <p className="text-[10px] text-muted-foreground">Since {new Date(eb.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/20 h-8 text-xs gap-1 rounded-lg hover:bg-destructive/5" onClick={() => handleRevokeEB(eb.id)}>
                    <UserMinus className="h-3 w-3" /> Revoke
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Organizer;
