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

const steps = ["Committee", "Country", "Experience", "Review"];

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
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Register for Event</h1>
          <p className="text-sm text-muted-foreground">{event?.title || "Loading..."}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i <= currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`text-xs font-medium hidden sm:block ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>{step}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-card animate-fade-in">
          {currentStep === 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">Select Committee</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(committees.length > 0 ? committees : [{ id: "unsc", name: "UNSC", agenda: "Security", capacity: 40 }, { id: "disec", name: "DISEC", agenda: "Disarmament", capacity: 50 }]).map((c: any) => (
                  <button key={c.id} onClick={() => setCommitteeId(c.id)}
                    className={`p-4 rounded-xl text-left transition-all border ${committeeId === c.id ? "bg-primary/10 border-primary text-foreground" : "bg-secondary text-muted-foreground border-border hover:border-primary/50"}`}>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs mt-1">{c.agenda}</p>
                    <p className="text-[10px] mt-1">{c.capacity} seats</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">Country Preference</h2>
              <div><Label className="text-xs text-muted-foreground">Enter your preferred country</Label><Input value={countryPref} onChange={(e) => setCountryPref(e.target.value)} placeholder="e.g., France, India, USA" className="mt-1 bg-secondary border-border" /></div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-foreground">MUN Experience</h2>
              <div><Label className="text-xs text-muted-foreground">Describe your MUN experience</Label><Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Number of MUNs attended, committees, awards..." className="mt-1 min-h-[100px] bg-secondary border-border" /></div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-foreground">Review & Submit</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Committee</span><span className="font-medium">{selectedCommittee?.name || committeeId}</span></div>
                <div className="flex justify-between p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Country</span><span className="font-medium">{countryPref || "No preference"}</span></div>
                <div className="flex justify-between p-3 bg-secondary rounded-lg"><span className="text-muted-foreground">Experience</span><span className="font-medium truncate max-w-[200px]">{experience || "Not provided"}</span></div>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Event Fee</span><span>₹{eventFee}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
                <div className="flex justify-between border-t border-border mt-2 pt-2"><span className="font-semibold">Total</span><span className="font-bold text-primary text-lg">₹{eventFee + platformFee}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" className="flex-1 border-border" onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button className="flex-1 bg-gradient-primary text-primary-foreground" disabled={!canNext()} onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
          ) : (
            <Button className="flex-1 bg-gradient-primary text-primary-foreground" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : `Pay ₹${eventFee + platformFee} & Register`}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EventRegister;
