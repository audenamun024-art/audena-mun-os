import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const EventRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [experience, setExperience] = useState("");
  const [countryPref, setCountryPref] = useState("");
  const [committees, setCommittees] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
      if (ev) {
        setEvent(ev);
        const { data: comms } = await supabase.from("committees").select("*").eq("event_id", id);
        setCommittees(comms || []);
      }
    };
    fetch();
  }, [id]);

  const eventFee = event?.registration_fee || 1200;
  const platformFee = event?.platform_fee || 25;

  const handleSubmit = async () => {
    if (!name || !email || !institution) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to register");
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("registrations").insert({
        user_id: user.id,
        event_id: id!,
        committee_id: committeeId || null,
        full_name: name,
        email,
        phone,
        institution,
        experience,
        country_preference: countryPref,
      });
      if (error) throw error;

      // Create transaction
      await supabase.from("transactions").insert({
        registration_id: crypto.randomUUID(),
        user_id: user.id,
        event_id: id!,
        amount: eventFee + platformFee,
        platform_fee: platformFee,
        payment_status: "completed",
      });

      toast.success("Registration submitted!");
      navigate(`/events/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-12 flex items-center gap-3">
        <Link to={`/events/${id}`}>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-serif text-lg font-bold text-foreground">Register</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Personal Details */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-serif text-base font-bold text-foreground">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Full Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Institution *</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Your college" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
        </section>

        {/* Committee */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-serif text-base font-bold text-foreground">Committee Preference</h2>
          <div className="flex flex-wrap gap-2">
            {(committees.length > 0 ? committees : [
              { id: "unsc", name: "UNSC" }, { id: "disec", name: "DISEC" }, { id: "who", name: "WHO" },
            ]).map((c: any) => (
              <button
                key={c.id}
                onClick={() => setCommitteeId(c.id)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  committeeId === c.id
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-secondary text-muted-foreground border-border hover:border-accent/50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Country Preference</Label>
            <Input value={countryPref} onChange={(e) => setCountryPref(e.target.value)} placeholder="e.g., France, India" className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">MUN Experience</Label>
            <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Describe your experience..." className="mt-1 min-h-[80px] bg-secondary border-border" />
          </div>
        </section>

        {/* Payment Summary */}
        <section className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-serif text-base font-bold text-foreground mb-3">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Event Fee</span><span className="text-foreground">₹{eventFee}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span className="text-foreground">₹{platformFee}</span></div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-accent text-lg">₹{eventFee + platformFee}</span>
            </div>
          </div>
        </section>

        <Button
          className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-medium h-12"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : `Pay ₹${eventFee + platformFee} & Register`}
        </Button>
      </div>
    </div>
  );
};

export default EventRegister;
