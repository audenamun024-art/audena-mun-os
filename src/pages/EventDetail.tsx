import AppLayout from "@/components/layout/AppLayout";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Calendar, MapPin, DollarSign, Share2, Users, ChevronRight, Clock,
  Gavel, ArrowRight, Globe, Award, Shield, ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageTransition, fadeInUp, staggerContainer, scaleIn } from "@/components/motion/PageTransition";
import eventImg1 from "@/assets/event-placeholder-1.jpg";
import eventImg2 from "@/assets/event-placeholder-2.jpg";

const bannerImages = [eventImg1, eventImg2];
const fallbackEvents: Record<string, any> = {
  "1": { title: "Delhi International MUN 2026", start_date: "2026-03-15T00:00:00", end_date: "2026-03-17T00:00:00", location: "New Delhi", registration_fee: 1200, platform_fee: 25, status: "published", description: "India's most prestigious Model United Nations conference, bringing together 500+ delegates from across South Asia for three days of intense diplomatic simulation, crisis management, and international policy debate.", max_delegates: 500, committees: [{ name: "UNSC", agenda: "Nuclear Proliferation in the 21st Century", capacity: 40 }, { name: "DISEC", agenda: "Regulation of Autonomous Weapons Systems", capacity: 50 }, { name: "UNHRC", agenda: "Rights of Refugees in Armed Conflicts", capacity: 45 }, { name: "ECOSOC", agenda: "Sustainable Development in Post-Pandemic World", capacity: 35 }] },
  "2": { title: "Mumbai Model United Nations", start_date: "2026-04-05T00:00:00", end_date: "2026-04-07T00:00:00", location: "Mumbai", registration_fee: 800, platform_fee: 25, status: "published", description: "Western India's largest MUN conference with 8 committees and 300+ delegates.", max_delegates: 300, committees: [{ name: "UNSC", agenda: "South China Sea Dispute", capacity: 35 }, { name: "UNGA", agenda: "Climate Action Framework", capacity: 60 }] },
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [committees, setCommittees] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRegistered, setUserRegistered] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) {
        setEvent(ev);
        const [{ data: comms }, { data: regs }] = await Promise.all([
          supabase.from("committees").select("*").eq("event_id", id),
          supabase.from("registrations").select("*, profiles:user_id(full_name, institution)").eq("event_id", id!),
        ]);
        setCommittees(comms || []);
        setRegistrations(regs || []);
        if (user) {
          const userReg = (regs || []).find((r: any) => r.user_id === user.id);
          setUserRegistered(!!userReg);
        }
      } else {
        const fb = fallbackEvents[id || "1"] || fallbackEvents["1"];
        setEvent(fb);
        setCommittees(fb.committees || []);
      }
      setLoading(false);
    };
    fetchAll();
  }, [id, user]);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const formatDateShort = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
    catch { return d; }
  };

  const getDaysUntil = (d: string) => {
    try {
      const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? `${diff} days away` : diff === 0 ? "Today!" : "Past event";
    } catch { return ""; }
  };

  if (loading) return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </AppLayout>
  );

  if (!event) return <AppLayout><div className="p-8 text-center text-muted-foreground">Event not found</div></AppLayout>;

  const fee = event.registration_fee || 0;
  const platformFee = event.platform_fee || 25;
  const totalCapacity = committees.reduce((s: number, c: any) => s + (c.capacity || 0), 0);
  const approvedRegs = registrations.filter((r: any) => r.status === "approved");

  // Build allocation matrix
  const allocationByCommittee = committees.map((c: any) => {
    const assigned = registrations.filter((r: any) => r.committee_id === c.id);
    const approved = assigned.filter((r: any) => r.status === "approved");
    return { ...c, assigned: assigned.length, approved: approved.length, fillPercent: Math.round((approved.length / (c.capacity || 1)) * 100) };
  });

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
          {/* Hero Banner */}
          <motion.div variants={scaleIn} initial="initial" animate="animate" className="relative h-64 md:h-80 rounded-3xl overflow-hidden">
            <img src={event.banner_url || bannerImages[0]} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize backdrop-blur-md ${
                  event.status === "published" ? "bg-success/20 text-success" : "bg-secondary/80 text-muted-foreground"
                }`}>{event.status}</span>
                {event.start_date && (
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-background/60 text-foreground backdrop-blur-md">
                    {getDaysUntil(event.start_date)}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight">{event.title}</h1>
            </div>
          </motion.div>

          {/* Quick Info Cards */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Calendar, label: event.start_date ? `${formatDateShort(event.start_date)} – ${formatDateShort(event.end_date)}` : "TBD", sublabel: "Date" },
              { icon: MapPin, label: event.location || "TBD", sublabel: "Venue" },
              { icon: Users, label: `${approvedRegs.length}/${totalCapacity || event.max_delegates || "∞"}`, sublabel: "Delegates" },
              { icon: DollarSign, label: `₹${fee + platformFee}`, sublabel: "Total Fee" },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="bg-card rounded-2xl border border-border p-4 shadow-card hover:shadow-elevated transition-shadow">
                <item.icon className="h-4 w-4 text-primary mb-2" />
                <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{item.sublabel}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* About */}
          <motion.section variants={fadeInUp} initial="initial" animate="animate"
            className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> About This Conference
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description || "No description provided."}</p>
          </motion.section>

          {/* Committees */}
          {committees.length > 0 && (
            <motion.section variants={fadeInUp} initial="initial" animate="animate">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-primary" /> Committees ({committees.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {committees.map((c: any, i: number) => (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-elevated transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                          <Gavel className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{c.name}</h3>
                          <p className="text-[10px] text-muted-foreground">{c.capacity} seats</p>
                        </div>
                      </div>
                      <Shield className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{c.agenda || "Agenda TBD"}</p>
                    {/* Capacity bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-semibold text-foreground">
                          {registrations.filter((r: any) => r.committee_id === (c.id || c.name) && r.status === "approved").length}/{c.capacity}
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((registrations.filter((r: any) => r.committee_id === (c.id || c.name) && r.status === "approved").length / (c.capacity || 1)) * 100, 100)}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Delegate Allocation Matrix */}
          {allocationByCommittee.length > 0 && registrations.length > 0 && (
            <motion.section variants={fadeInUp} initial="initial" animate="animate"
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" /> Delegate Allocation Matrix
                </h2>
                <p className="text-[11px] text-muted-foreground mt-1">Real-time committee fill status and delegate distribution</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Committee</th>
                      <th className="text-center py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Capacity</th>
                      <th className="text-center py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Applied</th>
                      <th className="text-center py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Approved</th>
                      <th className="text-center py-3 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fill %</th>
                      <th className="text-right py-3 px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationByCommittee.map((c, i) => (
                      <motion.tr
                        key={c.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                              <Gavel className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-[13px]">{c.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{c.agenda}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-3.5 px-3 text-foreground font-medium">{c.capacity}</td>
                        <td className="text-center py-3.5 px-3 text-foreground">{c.assigned}</td>
                        <td className="text-center py-3.5 px-3 font-semibold text-success">{c.approved}</td>
                        <td className="text-center py-3.5 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${Math.min(c.fillPercent, 100)}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-foreground w-8">{c.fillPercent}%</span>
                          </div>
                        </td>
                        <td className="text-right py-3.5 px-5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            c.fillPercent >= 90 ? "bg-destructive/10 text-destructive" :
                            c.fillPercent >= 50 ? "bg-warning/10 text-warning" :
                            "bg-success/10 text-success"
                          }`}>{c.fillPercent >= 90 ? "Almost Full" : c.fillPercent >= 50 ? "Filling Up" : "Open"}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Totals row */}
              <div className="px-5 py-3 bg-secondary/30 border-t border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Total</span>
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground">Capacity: <span className="font-bold text-foreground">{totalCapacity}</span></span>
                  <span className="text-muted-foreground">Applied: <span className="font-bold text-foreground">{registrations.length}</span></span>
                  <span className="text-muted-foreground">Approved: <span className="font-bold text-success">{approvedRegs.length}</span></span>
                </div>
              </div>
            </motion.section>
          )}

          {/* Fee Breakdown */}
          <motion.section variants={fadeInUp} initial="initial" animate="animate"
            className="bg-card rounded-2xl border border-border p-6 shadow-card">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Fee Breakdown
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Registration Fee</span>
                <span className="font-medium text-foreground">₹{fee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium text-foreground">₹{platformFee}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="font-bold text-foreground">Total Payable</span>
                <span className="font-black text-xl text-primary">₹{fee + platformFee}</span>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            variants={fadeInUp} initial="initial" animate="animate"
            className="flex gap-3 pb-8"
          >
            {userRegistered ? (
              <div className="flex-1 bg-success/10 border border-success/20 rounded-2xl p-4 text-center">
                <Award className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-sm font-semibold text-success">You're registered!</p>
                <p className="text-[11px] text-muted-foreground">Check your profile for status updates</p>
              </div>
            ) : (
              <Link to={`/events/${id}/register`} className="flex-1">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button className="w-full bg-gradient-primary text-primary-foreground font-semibold h-12 rounded-2xl text-sm gap-2">
                    Register Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                className="border-border h-12 w-12 rounded-2xl"
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default EventDetail;
