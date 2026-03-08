import AppLayout from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, fadeInUp } from "@/components/motion/PageTransition";
import { Check, ChevronRight, Gavel, Globe, Award, CreditCard } from "lucide-react";

const steps = [
  { label: "Committee", icon: Gavel },
  { label: "Country", icon: Globe },
  { label: "Experience", icon: Award },
  { label: "Review", icon: CreditCard },
];

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const EventRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [committeeId, setCommitteeId] = useState("");
  const [experience, setExperience] = useState("");
  const [countryPref, setCountryPref] = useState("");
  const [committees, setCommittees] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) { setEvent(ev); const { data: comms } = await supabase.from("committees").select("*").eq("event_id", id); setCommittees(comms || []); }
    };
    fetch();
  }, [id]);

  const eventFee = event?.registration_fee || 1200;
  const platformFee = event?.platform_fee || 25;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!user) { toast.error("Please sign in to register"); navigate("/auth"); return; }
      const { data: reg, error } = await supabase.from("registrations").insert([{
        user_id: user.id, event_id: id!, committee_id: committeeId || null,
        experience, country_preference: countryPref,
      }]).select().single();
      if (error) throw error;

      await supabase.from("transactions").insert([{
        user_id: user.id, registration_id: reg.id,
        amount: eventFee + platformFee, status: "completed" as any, payment_method: "platform",
      }]);

      toast.success("Registration submitted!");
      navigate(`/events/${id}`);
    } catch (err: any) { toast.error(err.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  const canNext = () => {
    if (currentStep === 0) return !!committeeId;
    if (currentStep === 1) return !!countryPref;
    return true;
  };

  const selectedCommittee = committees.find((c: any) => c.id === committeeId);

  return (
    <AppLayout>
      <PageTransition>
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
          {/* Header */}
          <motion.div variants={fadeInUp} initial="initial" animate="animate">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Register for Event</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{event?.title || "Loading..."}</p>
          </motion.div>

          {/* Step Indicator */}
          <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex items-center gap-0">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <motion.div
                    animate={{
                      scale: i === currentStep ? 1.1 : 1,
                      backgroundColor: i <= currentStep ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                  >
                    {i < currentStep ? (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <step.icon className={`h-4 w-4 ${i <= currentStep ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 mx-1 mb-5">
                    <div className="h-0.5 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: i < currentStep ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card"
            >
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Select Your Committee</h2>
                    <p className="text-xs text-muted-foreground mt-1">Choose the committee you'd like to participate in</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(committees.length > 0 ? committees : [
                      { id: "unsc", name: "UNSC", agenda: "Nuclear Proliferation", capacity: 40 },
                      { id: "disec", name: "DISEC", agenda: "Autonomous Weapons", capacity: 50 },
                    ]).map((c: any) => (
                      <motion.button
                        key={c.id}
                        onClick={() => setCommitteeId(c.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-5 rounded-2xl text-left transition-all border ${
                          committeeId === c.id
                            ? "bg-primary/8 border-primary shadow-sm"
                            : "bg-secondary/50 border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Gavel className={`h-4 w-4 ${committeeId === c.id ? "text-primary" : "text-muted-foreground"}`} />
                          <p className={`font-bold text-sm ${committeeId === c.id ? "text-primary" : "text-foreground"}`}>{c.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.agenda}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">{c.capacity} seats available</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Country Preference</h2>
                    <p className="text-xs text-muted-foreground mt-1">Which country would you like to represent?</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium">Country Name</Label>
                    <Input
                      value={countryPref}
                      onChange={(e) => setCountryPref(e.target.value)}
                      placeholder="e.g., France, India, United States"
                      className="mt-1.5 bg-secondary border-border h-11 rounded-xl"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Your MUN Experience</h2>
                    <p className="text-xs text-muted-foreground mt-1">Help us understand your background</p>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground font-medium">Experience Summary</Label>
                    <Textarea
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Number of MUNs attended, committees served, awards won..."
                      className="mt-1.5 min-h-[120px] bg-secondary border-border rounded-xl"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Review & Confirm</h2>
                    <p className="text-xs text-muted-foreground mt-1">Double-check your details before submitting</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Committee", value: selectedCommittee?.name || committeeId },
                      { label: "Country", value: countryPref || "No preference" },
                      { label: "Experience", value: experience || "Not provided" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between p-3.5 bg-secondary/50 rounded-xl">
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-secondary/50 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Event Fee</span><span className="text-foreground">₹{eventFee}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span className="text-foreground">₹{platformFee}</span></div>
                    <div className="flex justify-between border-t border-border mt-2 pt-3">
                      <span className="font-bold text-foreground">Total</span>
                      <span className="font-black text-xl text-primary">₹{eventFee + platformFee}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 pb-6">
            {currentStep > 0 && (
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1">
                <Button variant="outline" className="w-full border-border h-11 rounded-xl" onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1">
              {currentStep < steps.length - 1 ? (
                <Button className="w-full bg-gradient-primary text-primary-foreground h-11 rounded-xl gap-1.5" disabled={!canNext()} onClick={() => setCurrentStep(currentStep + 1)}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button className="w-full bg-gradient-primary text-primary-foreground h-11 rounded-xl" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Processing..." : `Pay ₹${eventFee + platformFee} & Register`}
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
};

export default EventRegister;
