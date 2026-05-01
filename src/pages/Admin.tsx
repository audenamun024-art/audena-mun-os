import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Shield, Flag, BarChart3, Home, ArrowLeft, Trash2, Image as ImageIcon,
  Video, Sparkles, Eye, Activity, RefreshCw, Search, AlertTriangle, ExternalLink,
  Building2, Plus, Mail, Copy, Globe, Phone, X, Loader2, Award, KeyRound,
  Calendar, IndianRupee, MapPin, Receipt, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import audenaLogo from "@/assets/audena-logo.jpg";

type Tab = "overview" | "users" | "organizations" | "events" | "payments" | "videos" | "posts" | "stories";

const Admin = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pulse, setPulse] = useState(false);

  // Event dialog
  const [eventDialog, setEventDialog] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [eventForm, setEventForm] = useState({
    title: "", description: "", cover_url: "", location: "",
    start_date: "", end_date: "", fee: 0, currency: "INR", capacity: 0, category: "MUN",
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Dialogs
  const [userDetail, setUserDetail] = useState<any | null>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [orgDialog, setOrgDialog] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [orgForm, setOrgForm] = useState({
    name: "", email: "", password: "", description: "",
    website: "", contact_person: "", phone: "",
  });
  const [orgSubmitting, setOrgSubmitting] = useState(false);
  const [orgCreatedCreds, setOrgCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  const fetchAll = async () => {
    const [profRes, vidRes, postRes, storyRes, orgRes, evRes, payRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("videos").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("stories").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("organizations" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("events" as any).select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("payments" as any).select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    setProfiles(profRes.data || []);
    setVideos(vidRes.data || []);
    setPosts(postRes.data || []);
    setStories(storyRes.data || []);
    setOrganizations((orgRes.data as any[]) || []);
    setEvents((evRes.data as any[]) || []);
    setPayments((payRes.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const flash = () => { setPulse(true); setTimeout(() => setPulse(false), 800); };
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "organizations" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => { fetchAll(); flash(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => { fetchAll(); flash(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ---- content actions ----
  const handleFlagVideo = async (id: string, flagged: boolean) => {
    const { error } = await supabase.from("videos").update({ flagged: !flagged }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(flagged ? "Video unflagged" : "Video flagged");
  };
  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Delete this video permanently?")) return;
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Video deleted");
  };
  const handleDeletePost = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
  };
  const handleDeleteStory = async (id: string) => {
    if (!confirm("Delete this story permanently?")) return;
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Story deleted");
  };
  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Delete this user profile? (auth user remains)")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profile deleted");
  };

  // ---- user dialog ----
  const openUserDetail = async (p: any) => {
    setUserDetail(p);
    const [vRes, pRes] = await Promise.all([
      supabase.from("videos").select("*").eq("user_id", p.user_id).order("created_at", { ascending: false }),
      supabase.from("posts").select("*").eq("user_id", p.user_id).order("created_at", { ascending: false }),
    ]);
    setUserVideos(vRes.data || []);
    setUserPosts(pRes.data || []);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const { id, full_name, institution, bio, phone, rank_points } = editingUser;
    const { error } = await supabase.from("profiles").update({
      full_name, institution, bio, phone, rank_points,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    setEditingUser(null);
  };

  // ---- organization actions ----
  const resetOrgForm = () => setOrgForm({
    name: "", email: "", password: "", description: "",
    website: "", contact_person: "", phone: "",
  });

  const openCreateOrg = () => {
    resetOrgForm();
    setOrgDialog({ open: true, editing: null });
  };
  const openEditOrg = (o: any) => {
    setOrgForm({
      name: o.name || "", email: o.email || "", password: "",
      description: o.description || "", website: o.website || "",
      contact_person: o.contact_person || "", phone: o.phone || "",
    });
    setOrgDialog({ open: true, editing: o });
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setOrgForm((f) => ({ ...f, password: pw }));
  };

  const submitOrg = async () => {
    if (!orgForm.name.trim() || !orgForm.email.trim()) {
      return toast.error("Name and email are required");
    }
    setOrgSubmitting(true);
    try {
      if (orgDialog.editing) {
        const { error } = await supabase.from("organizations" as any).update({
          name: orgForm.name,
          email: orgForm.email,
          description: orgForm.description || null,
          website: orgForm.website || null,
          contact_person: orgForm.contact_person || null,
          phone: orgForm.phone || null,
        }).eq("id", orgDialog.editing.id);
        if (error) throw error;
        toast.success("Organization updated");
        setOrgDialog({ open: false, editing: null });
      } else {
        if (orgForm.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/admin-create-organization`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(orgForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create organization");
        setOrgCreatedCreds({ email: orgForm.email, password: orgForm.password });
        toast.success("Organization created");
        setOrgDialog({ open: false, editing: null });
        fetchAll();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setOrgSubmitting(false);
    }
  };

  const deleteOrg = async (o: any) => {
    if (!confirm(`Delete organization "${o.name}"? This will not delete the auth account.`)) return;
    const { error } = await supabase.from("organizations" as any).delete().eq("id", o.id);
    if (error) return toast.error(error.message);
    toast.success("Organization deleted");
  };

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  // ---- derived ----
  const filtered = (list: any[], keys: string[]) =>
    !search ? list : list.filter((x) => keys.some((k) => (x[k] || "").toString().toLowerCase().includes(search.toLowerCase())));

  const stats = [
    { label: "Users", value: profiles.length, icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Organizations", value: organizations.length, icon: Building2, color: "from-violet-500 to-blue-500" },
    { label: "Videos", value: videos.length, icon: Video, color: "from-indigo-500 to-blue-500" },
    { label: "Posts", value: posts.length, icon: ImageIcon, color: "from-cyan-500 to-sky-500" },
    { label: "Stories", value: stories.length, icon: Sparkles, color: "from-sky-500 to-blue-500" },
    { label: "Flagged", value: videos.filter((v) => v.flagged).length, icon: AlertTriangle, color: "from-amber-500 to-orange-500" },
  ];

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: "overview", label: "Overview", icon: BarChart3, count: 0 },
    { key: "users", label: "Users", icon: Users, count: profiles.length },
    { key: "organizations", label: "Organizations", icon: Building2, count: organizations.length },
    { key: "videos", label: "Videos", icon: Video, count: videos.length },
    { key: "posts", label: "Posts", icon: ImageIcon, count: posts.length },
    { key: "stories", label: "Stories", icon: Sparkles, count: stories.length },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 glass-panel border-b border-border/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-secondary text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white ring-1 ring-primary/30">
              <img src={audenaLogo} alt="Audena Hub" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-base font-display font-bold text-gradient-primary leading-none">Audena Admin</p>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${pulse ? "bg-success animate-ping" : "bg-success"}`} /> Live Control Center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-xs" onClick={fetchAll}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${pulse ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link to="/"><Button variant="ghost" size="sm" className="text-xs"><Home className="h-4 w-4 mr-1" /> App</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Control Center
            </h1>
            <p className="text-sm text-muted-foreground">Realtime moderation across the entire platform</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users, orgs, content..."
                className="pl-9 h-10 rounded-xl bg-secondary/60"
              />
            </div>
            {activeTab === "organizations" && (
              <Button size="sm" className="h-10 bg-gradient-primary text-primary-foreground rounded-xl shadow-glow" onClick={openCreateOrg}>
                <Plus className="h-4 w-4 mr-1" /> New Org
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-panel rounded-xl p-4 shadow-card hover:border-primary/40 transition-colors">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2.5 shadow-glow`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>}
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-secondary/50 rounded-2xl p-1 border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20" : "bg-secondary"}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-primary" /><h2 className="text-base font-bold">Activity Pulse</h2></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Active users</span><span className="font-bold">{profiles.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Organizations</span><span className="font-bold">{organizations.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Videos uploaded</span><span className="font-bold">{videos.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Explore posts</span><span className="font-bold">{posts.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-muted-foreground">Live stories</span><span className="font-bold">{stories.length}</span></div>
                <div className="flex justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30"><span className="text-amber-300">Flagged content</span><span className="font-bold text-amber-300">{videos.filter((v) => v.flagged).length}</span></div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-base font-bold">Latest Uploads</h2></div>
              <div className="space-y-2">
                {[...videos.slice(0, 3), ...posts.slice(0, 2)].slice(0, 5).map((item: any, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {item.image_url ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title || item.caption || "Untitled"}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {videos.length === 0 && posts.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No content yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <section className="glass-panel rounded-2xl p-2 animate-fade-in overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Institution</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered(profiles, ["full_name", "institution"]).map((p, i) => (
                    <TableRow key={p.id} className="hover:bg-secondary/40">
                      <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                              {(p.full_name || "?").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{p.full_name || "Unnamed"}</p>
                            <p className="text-[11px] text-muted-foreground truncate md:hidden">{p.institution || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{p.institution || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        <span className="inline-flex items-center gap-1"><Award className="h-3 w-3 text-primary" />{p.rank_points || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => openUserDetail(p)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingUser({ ...p })}>
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Link to={`/profile/${p.user_id}`} className="p-1.5 hover:bg-secondary rounded-md inline-flex">
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => handleDeleteProfile(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {profiles.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No users yet</p>}
            </div>
          </section>
        )}

        {/* ORGANIZATIONS */}
        {activeTab === "organizations" && (
          <section className="space-y-3 animate-fade-in">
            {filtered(organizations, ["name", "email", "contact_person"]).length === 0 && (
              <div className="glass-panel rounded-2xl p-12 text-center">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold mb-1">No organizations yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create one to onboard a MUN host or partner.</p>
                <Button onClick={openCreateOrg} className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Create Organization</Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered(organizations, ["name", "email", "contact_person"]).map((o) => (
                <div key={o.id} className="glass-panel rounded-2xl p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    {o.logo_url ? (
                      <img src={o.logo_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                        <Building2 className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{o.name}</p>
                        <Badge variant="outline" className="text-[9px] py-0 border-primary/40 text-primary">{o.status || "active"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {o.email}
                        <button onClick={() => copyText("Email", o.email)} className="ml-1 hover:text-primary"><Copy className="h-3 w-3" /></button>
                      </p>
                      {o.contact_person && <p className="text-[11px] text-muted-foreground mt-0.5">Contact: {o.contact_person}</p>}
                      {o.website && <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5"><Globe className="h-3 w-3" /> {o.website}</p>}
                      {o.phone && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {o.phone}</p>}
                      {o.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{o.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => openEditOrg(o)}>Edit</Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-destructive/30" onClick={() => deleteOrg(o)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* VIDEOS */}
        {activeTab === "videos" && (
          <section className="space-y-2 animate-fade-in">
            {filtered(videos, ["title", "category"]).map((v) => (
              <div key={v.id} className={`flex items-center gap-3 p-3 glass-panel rounded-xl shadow-card ${v.flagged ? "border-amber-500/40" : ""}`}>
                {v.thumbnail_url ? (
                  <img src={v.thumbnail_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Video className="h-5 w-5 text-muted-foreground" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground truncate">{v.title || "Untitled"}</p>
                    {v.flagged && <Badge variant="outline" className="text-amber-300 border-amber-500/40 text-[9px] py-0">FLAGGED</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.category || "Uncategorized"} · {v.views || 0} views · {new Date(v.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleFlagVideo(v.id, v.flagged)}>
                    <Flag className="h-3 w-3 mr-1" /> {v.flagged ? "Unflag" : "Flag"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 h-8" onClick={() => handleDeleteVideo(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {videos.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No videos</p>}
          </section>
        )}

        {/* POSTS */}
        {activeTab === "posts" && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
            {filtered(posts, ["caption", "category"]).map((p) => (
              <div key={p.id} className="glass-panel rounded-xl overflow-hidden shadow-card group">
                <div className="aspect-square overflow-hidden bg-secondary">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{p.caption || "No caption"}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.category || "—"} · ❤ {p.likes_count}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-destructive border-destructive/30 h-8 text-xs" onClick={() => handleDeletePost(p.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-12">No posts</p>}
          </section>
        )}

        {/* STORIES */}
        {activeTab === "stories" && (
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-fade-in">
            {filtered(stories, ["caption"]).map((s) => {
              const expired = new Date(s.expires_at) < new Date();
              return (
                <div key={s.id} className="glass-panel rounded-xl overflow-hidden shadow-card relative group">
                  <div className="aspect-[9/16] bg-secondary relative">
                    {s.media_type === "video" ? (
                      <video src={s.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={s.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {expired && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Badge variant="outline" className="text-amber-300 border-amber-500/40 text-[9px]">EXPIRED</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-muted-foreground truncate">{new Date(s.created_at).toLocaleDateString()}</p>
                    <Button size="sm" variant="outline" className="w-full mt-1.5 text-destructive border-destructive/30 h-7 text-[11px]" onClick={() => handleDeleteStory(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {stories.length === 0 && <p className="col-span-full text-sm text-muted-foreground text-center py-12">No stories</p>}
          </section>
        )}
      </main>

      {/* USER DETAIL DIALOG */}
      <Dialog open={!!userDetail} onOpenChange={(o) => !o && setUserDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {userDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {userDetail.avatar_url ? (
                    <img src={userDetail.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {(userDetail.full_name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {userDetail.full_name || "Unnamed"}
                </DialogTitle>
                <DialogDescription>
                  {userDetail.institution || "No institution"} · Joined {new Date(userDetail.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-2 my-3">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{userVideos.length}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Videos</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{userPosts.length}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Posts</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{userDetail.rank_points || 0}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">Points</p>
                </div>
              </div>
              {userDetail.bio && <p className="text-sm text-muted-foreground bg-secondary/40 rounded-xl p-3">{userDetail.bio}</p>}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent videos</p>
                <div className="grid grid-cols-3 gap-2">
                  {userVideos.slice(0, 6).map((v) => (
                    <div key={v.id} className="aspect-square rounded-lg bg-secondary overflow-hidden relative">
                      {v.thumbnail_url ? <img src={v.thumbnail_url} className="w-full h-full object-cover" alt="" /> : <Video className="h-5 w-5 text-muted-foreground absolute inset-0 m-auto" />}
                    </div>
                  ))}
                  {userVideos.length === 0 && <p className="text-xs text-muted-foreground col-span-3">No videos</p>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT USER DIALOG */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent>
          {editingUser && (
            <>
              <DialogHeader>
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription>Update profile fields. Changes apply instantly.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Full name</Label><Input value={editingUser.full_name || ""} onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })} /></div>
                <div><Label className="text-xs">Institution</Label><Input value={editingUser.institution || ""} onChange={(e) => setEditingUser({ ...editingUser, institution: e.target.value })} /></div>
                <div><Label className="text-xs">Phone</Label><Input value={editingUser.phone || ""} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} /></div>
                <div><Label className="text-xs">Bio</Label><Textarea value={editingUser.bio || ""} onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })} /></div>
                <div><Label className="text-xs">Rank points</Label><Input type="number" value={editingUser.rank_points || 0} onChange={(e) => setEditingUser({ ...editingUser, rank_points: Number(e.target.value) })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                <Button className="bg-gradient-primary text-primary-foreground" onClick={handleSaveUser}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ORG CREATE/EDIT DIALOG */}
      <Dialog open={orgDialog.open} onOpenChange={(o) => !o && setOrgDialog({ open: false, editing: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {orgDialog.editing ? "Edit organization" : "Create organization"}
            </DialogTitle>
            <DialogDescription>
              {orgDialog.editing
                ? "Update organization details."
                : "Provision an account. Share the credentials with the organization to let them log in."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div><Label className="text-xs">Organization name *</Label><Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
            <div><Label className="text-xs">Login email *</Label>
              <Input type="email" value={orgForm.email} disabled={!!orgDialog.editing}
                onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} />
            </div>
            {!orgDialog.editing && (
              <div>
                <Label className="text-xs">Login password * (min 8 chars)</Label>
                <div className="flex gap-2">
                  <Input value={orgForm.password} onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })} placeholder="Set or generate" />
                  <Button type="button" variant="outline" onClick={generatePassword} className="shrink-0">Generate</Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">You'll see the credentials once after creation — copy and share them with the organization.</p>
              </div>
            )}
            <div><Label className="text-xs">Contact person</Label><Input value={orgForm.contact_person} onChange={(e) => setOrgForm({ ...orgForm, contact_person: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Phone</Label><Input value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} /></div>
              <div><Label className="text-xs">Website</Label><Input value={orgForm.website} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgDialog({ open: false, editing: null })}>Cancel</Button>
            <Button className="bg-gradient-primary text-primary-foreground" onClick={submitOrg} disabled={orgSubmitting}>
              {orgSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (orgDialog.editing ? "Save" : "Create & Provision")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ORG CREDENTIALS DIALOG (one-time view) */}
      <Dialog open={!!orgCreatedCreds} onOpenChange={(o) => !o && setOrgCreatedCreds(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Organization credentials</DialogTitle>
            <DialogDescription>
              Share these with the organization. Password is shown only once — copy now.
            </DialogDescription>
          </DialogHeader>
          {orgCreatedCreds && (
            <div className="space-y-3">
              <div className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Email</p>
                  <p className="font-mono text-sm">{orgCreatedCreds.email}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => copyText("Email", orgCreatedCreds.email)}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Password</p>
                  <p className="font-mono text-sm">{orgCreatedCreds.password}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => copyText("Password", orgCreatedCreds.password)}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
              <Button className="w-full bg-gradient-primary text-primary-foreground" onClick={() => {
                copyText("Credentials", `Email: ${orgCreatedCreds.email}\nPassword: ${orgCreatedCreds.password}`);
              }}><Copy className="h-4 w-4 mr-1.5" /> Copy both</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
