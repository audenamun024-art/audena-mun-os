import { useState, useEffect } from "react";
import { Users, Calendar, Banknote, Shield, AlertTriangle, Globe, Check, X, ArrowLeft, BarChart3, Flag, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Admin = () => {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "organizers" | "events" | "delegates" | "buzz">("overview");
  const [stats, setStats] = useState({ organizers: 0, events: 0, delegates: 0, revenue: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      const [orgRes, evtRes, profRes, vidRes, txnRes] = await Promise.all([
        supabase.from("organizers").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("rank_points", { ascending: false }),
        supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("transactions").select("amount").eq("payment_status", "completed"),
      ]);
      setOrganizers(orgRes.data || []);
      setEvents(evtRes.data || []);
      setAllProfiles(profRes.data || []);
      setVideos(vidRes.data || []);
      const totalRevenue = (txnRes.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0);
      setStats({
        organizers: orgRes.data?.length || 0,
        events: evtRes.data?.length || 0,
        delegates: profRes.data?.length || 0,
        revenue: totalRevenue,
      });
    };
    fetchAll();
  }, []);

  const handleApprove = async (id: string) => {
    await supabase.from("organizers").update({ status: "approved" }).eq("id", id);
    setOrganizers(organizers.map(o => o.id === id ? { ...o, status: "approved" } : o));
    toast.success("Organizer approved");
  };

  const handleReject = async (id: string) => {
    await supabase.from("organizers").update({ status: "rejected" }).eq("id", id);
    setOrganizers(organizers.map(o => o.id === id ? { ...o, status: "rejected" } : o));
    toast.info("Organizer rejected");
  };

  const handleFlagVideo = async (id: string) => {
    await supabase.from("videos").update({ flagged: true }).eq("id", id);
    setVideos(videos.map(v => v.id === id ? { ...v, flagged: true } : v));
    toast.info("Video flagged");
  };

  const pendingOrgs = organizers.filter(o => o.status === "pending");
  const statCards = [
    { label: "Organizers", value: stats.organizers, icon: Gavel, color: "text-accent" },
    { label: "Events", value: stats.events, icon: Calendar, color: "text-accent" },
    { label: "Delegates", value: stats.delegates, icon: Users, color: "text-accent" },
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Banknote, color: "text-accent" },
  ];

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "organizers", label: `Organizers (${pendingOrgs.length})`, icon: Gavel },
    { key: "events", label: "Events", icon: Calendar },
    { key: "delegates", label: "Delegates", icon: Users },
    { key: "buzz", label: "Buzz", icon: Flag },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <span className="font-serif text-lg font-bold text-gradient-gold">Admin</span>
          <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">Master</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/research">
            <Button size="sm" variant="ghost" className="text-xs h-8"><Globe className="h-4 w-4" /></Button>
          </Link>
          <Link to="/crisis">
            <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Crisis
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-secondary rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
            <section className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-serif text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Gavel className="h-4 w-4 text-accent" /> Pending Approvals
              </h2>
              {pendingOrgs.length === 0 ? (
                <p className="text-sm text-muted-foreground">All caught up — no pending organizers</p>
              ) : pendingOrgs.slice(0, 5).map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg mb-2">
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
            </section>

            <section className="bg-card rounded-xl border border-border p-4">
              <h2 className="font-serif text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" /> Recent Events
              </h2>
              {events.slice(0, 5).map((e) => (
                <Link to={`/events/${e.id}`} key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg mb-2 hover:bg-secondary/80 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.location} · ₹{e.registration_fee}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                    e.status === "open" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                  }`}>{e.status}</span>
                </Link>
              ))}
              {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet</p>}
            </section>
          </div>
        )}

        {/* Organizers Tab */}
        {activeTab === "organizers" && (
          <section className="space-y-2 animate-fade-in">
            {organizers.map((org) => (
              <div key={org.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Gavel className="h-5 w-5 text-accent" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-foreground">{org.institution_name}</p>
                    <p className="text-xs text-muted-foreground">{org.contact_person} · {org.location}</p>
                  </div>
                </div>
                {org.status === "pending" ? (
                  <div className="flex gap-1">
                    <Button size="sm" className="bg-green-600 text-white h-7 px-2 text-xs" onClick={() => handleApprove(org.id)}>Approve</Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 px-2 text-xs" onClick={() => handleReject(org.id)}>Reject</Button>
                  </div>
                ) : (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                    org.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"
                  }`}>{org.status}</span>
                )}
              </div>
            ))}
            {organizers.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No organizer applications</p>}
          </section>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <section className="space-y-2 animate-fade-in">
            {events.map((e) => (
              <Link to={`/events/${e.id}`} key={e.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-accent/20 transition-colors">
                <div>
                  <p className="font-semibold text-sm text-foreground">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.location} · {e.start_date} · ₹{e.registration_fee}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                  e.status === "open" ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                }`}>{e.status}</span>
              </Link>
            ))}
            {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No events</p>}
          </section>
        )}

        {/* Delegates Tab */}
        {activeTab === "delegates" && (
          <section className="space-y-2 animate-fade-in">
            {allProfiles.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                  #{i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{p.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.institution || "No institution"} · {p.account_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{p.rank_points || 0} pts</p>
                  <p className="text-[10px] text-muted-foreground">{p.total_muns || 0} MUNs</p>
                </div>
              </div>
            ))}
            {allProfiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No delegates yet</p>}
          </section>
        )}

        {/* Buzz Moderation Tab */}
        {activeTab === "buzz" && (
          <section className="space-y-2 animate-fade-in">
            {videos.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                <div>
                  <p className="font-semibold text-sm text-foreground">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.category} · {v.views || 0} views · {v.likes || 0} likes</p>
                </div>
                {v.flagged ? (
                  <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-medium">Flagged</span>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs h-7 border-border" onClick={() => handleFlagVideo(v.id)}>
                    <Flag className="h-3 w-3 mr-1" /> Flag
                  </Button>
                )}
              </div>
            ))}
            {videos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No videos</p>}
          </section>
        )}
      </div>
    </div>
  );
};

export default Admin;
