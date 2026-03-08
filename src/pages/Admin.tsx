import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Calendar, Banknote, Shield, Check, X, BarChart3, Flag, Gavel, AlertTriangle, Globe, Home, Play, Settings, CreditCard, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import SearchModal from "@/components/layout/SearchModal";
import { Search } from "lucide-react";

const adminNavItems = [
  { title: "Overview", url: "/admin", icon: BarChart3 },
  { title: "Organizers", url: "/admin?tab=organizers", icon: Gavel },
  { title: "Events", url: "/admin?tab=events", icon: Calendar },
  { title: "Delegates", url: "/admin?tab=delegates", icon: Users },
  { title: "Buzz Moderation", url: "/admin?tab=buzz", icon: Flag },
  { title: "Payments", url: "/admin?tab=payments", icon: CreditCard },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          {!collapsed && <span className="text-lg font-extrabold tracking-tight text-gradient-primary">Admin</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="">
                    <Home className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Back to App</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/crisis" className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Crisis Mode</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-3 space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={async () => { await signOut(); navigate("/auth"); }}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const Admin = () => {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "organizers" | "events" | "delegates" | "buzz" | "payments">("overview");
  const [stats, setStats] = useState({ organizers: 0, events: 0, delegates: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["overview", "organizers", "events", "delegates", "buzz", "payments"].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      const [orgRes, evtRes, profRes, vidRes, txnRes] = await Promise.all([
        supabase.from("organizers").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("rank_points", { ascending: false }),
        supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("transactions").select("amount, status"),
      ]);
      setOrganizers(orgRes.data || []);
      setEvents(evtRes.data || []);
      setAllProfiles(profRes.data || []);
      setVideos(vidRes.data || []);
      const totalRevenue = (txnRes.data || []).filter((t: any) => t.status === "completed").reduce((s: number, t: any) => s + (Number(t.amount) || 0), 0);
      setStats({ organizers: orgRes.data?.length || 0, events: evtRes.data?.length || 0, delegates: profRes.data?.length || 0, revenue: totalRevenue });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleApprove = async (id: string) => {
    await supabase.from("organizers").update({ status: "approved" as any }).eq("id", id);
    setOrganizers(organizers.map(o => o.id === id ? { ...o, status: "approved" } : o));
    toast.success("Organizer approved");
  };

  const handleReject = async (id: string) => {
    await supabase.from("organizers").update({ status: "rejected" as any }).eq("id", id);
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
    { label: "Organizers", value: stats.organizers, icon: Gavel, color: "bg-primary/10 text-primary" },
    { label: "Events", value: stats.events, icon: Calendar, color: "bg-indigo/10 text-indigo" },
    { label: "Delegates", value: stats.delegates, icon: Users, color: "bg-accent/10 text-accent" },
    { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Banknote, color: "bg-success/10 text-success" },
  ];

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "organizers", label: `Organizers (${pendingOrgs.length})`, icon: Gavel },
    { key: "events", label: "Events", icon: Calendar },
    { key: "delegates", label: "Delegates", icon: Users },
    { key: "buzz", label: "Buzz", icon: Flag },
  ] as const;

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-foreground hover:bg-secondary" />
                <span className="text-lg font-extrabold tracking-tight md:hidden text-gradient-primary">Admin</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary h-9 w-9" onClick={() => setSearchOpen(true)}>
                  <Search className="h-5 w-5" />
                </Button>
                <NotificationDropdown />
                <Link to="/profile">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">{initials}</span>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Platform oversight and moderation</p>
                </div>
                <Link to="/crisis"><Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Crisis</Button></Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((s) => (
                  <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card hover:shadow-elevated transition-shadow">
                    <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}><s.icon className="h-4 w-4" /></div>
                    <p className="text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-7 w-16" /> : s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-1 overflow-x-auto bg-secondary rounded-xl p-1">
                {tabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <tab.icon className="h-3.5 w-3.5" />{tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
                  <section className="bg-card rounded-xl border border-border p-5 shadow-card">
                    <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2"><Gavel className="h-4 w-4 text-primary" /> Pending Approvals</h2>
                    {pendingOrgs.length === 0 ? <p className="text-sm text-muted-foreground">All caught up ✓</p> : pendingOrgs.slice(0, 5).map((org) => (
                      <div key={org.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg mb-2">
                        <div><p className="font-medium text-sm text-foreground">{org.name}</p><p className="text-xs text-muted-foreground">{org.contact_email}</p></div>
                        <div className="flex gap-1">
                          <Button size="sm" className="bg-success hover:bg-success/90 text-primary-foreground h-7 w-7 p-0" onClick={() => handleApprove(org.id)}><Check className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 w-7 p-0" onClick={() => handleReject(org.id)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </section>
                  <section className="bg-card rounded-xl border border-border p-5 shadow-card">
                    <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo" /> Recent Events</h2>
                    {events.slice(0, 5).map((e) => (
                      <Link to={`/events/${e.id}`} key={e.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg mb-2 hover:bg-secondary/80 transition-colors">
                        <div><p className="font-medium text-sm text-foreground">{e.title}</p><p className="text-xs text-muted-foreground">{e.location} · ₹{e.registration_fee}</p></div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${e.status === "published" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>{e.status}</span>
                      </Link>
                    ))}
                    {events.length === 0 && <p className="text-sm text-muted-foreground">No events yet</p>}
                  </section>
                </div>
              )}

              {activeTab === "organizers" && (
                <section className="space-y-2 animate-fade-in">
                  {organizers.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-card">
                      <div className="flex items-center gap-3">
                        {org.logo_url ? <img src={org.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Gavel className="h-5 w-5 text-primary" /></div>}
                        <div><p className="font-semibold text-sm text-foreground">{org.name}</p><p className="text-xs text-muted-foreground">{org.contact_email}</p></div>
                      </div>
                      {org.status === "pending" ? (
                        <div className="flex gap-1">
                          <Button size="sm" className="bg-success text-primary-foreground h-7 px-2 text-xs" onClick={() => handleApprove(org.id)}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-7 px-2 text-xs" onClick={() => handleReject(org.id)}>Reject</Button>
                        </div>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${org.status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{org.status}</span>
                      )}
                    </div>
                  ))}
                  {organizers.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No organizer applications</p>}
                </section>
              )}

              {activeTab === "events" && (
                <section className="space-y-2 animate-fade-in">
                  {events.map((e) => (
                    <Link to={`/events/${e.id}`} key={e.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-card hover:border-primary/20 transition-colors">
                      <div><p className="font-semibold text-sm text-foreground">{e.title}</p><p className="text-xs text-muted-foreground">{e.location} · {e.start_date} · ₹{e.registration_fee}</p></div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${e.status === "published" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>{e.status}</span>
                    </Link>
                  ))}
                  {events.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No events</p>}
                </section>
              )}

              {activeTab === "delegates" && (
                <section className="space-y-2 animate-fade-in">
                  {allProfiles.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border shadow-card">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">#{i + 1}</span>
                      <div className="flex-1"><p className="font-semibold text-sm text-foreground">{p.full_name || "—"}</p><p className="text-xs text-muted-foreground">{p.institution || "No institution"} · {p.account_type}</p></div>
                      <div className="text-right"><p className="text-sm font-bold text-primary">{p.rank_points || 0} pts</p><p className="text-[10px] text-muted-foreground">{p.muns_attended || 0} MUNs</p></div>
                    </div>
                  ))}
                  {allProfiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No delegates yet</p>}
                </section>
              )}

              {activeTab === "buzz" && (
                <section className="space-y-2 animate-fade-in">
                  {videos.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-card">
                      <div><p className="font-semibold text-sm text-foreground">{v.title}</p><p className="text-xs text-muted-foreground">{v.category} · {v.views || 0} views</p></div>
                      {v.flagged ? (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-semibold">Flagged</span>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-7 border-border" onClick={() => handleFlagVideo(v.id)}><Flag className="h-3 w-3 mr-1" /> Flag</Button>
                      )}
                    </div>
                  ))}
                  {videos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No videos</p>}
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </SidebarProvider>
  );
};

export default Admin;
