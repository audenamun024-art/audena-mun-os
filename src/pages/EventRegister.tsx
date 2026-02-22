import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

const committees = ["UNSC", "DISEC", "WHO", "UNHRC", "ECOSOC", "UNEP", "UNGA", "AIPPM"];

const EventRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [committee, setCommittee] = useState("");
  const [experience, setExperience] = useState("");
  const [countryPref, setCountryPref] = useState("");

  const eventFee = 1200;
  const platformFee = 25;

  const handleSubmit = () => {
    if (!name || !email || !institution || !committee) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Registration submitted! Check your email for confirmation.");
    navigate(`/events/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-gradient border-b border-navy-light px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to={`/events/${id}`}>
            <Button size="sm" variant="ghost" className="text-gold-light hover:bg-navy-light h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-serif text-lg font-bold text-gold-light">Register</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Personal Details */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground">Personal Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Full Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Institution *</Label>
              <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Your college/school" className="mt-1" />
            </div>
          </div>
        </section>

        {/* Committee Selection */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground">Committee Preference</h2>

          <div>
            <Label className="text-xs font-medium mb-2 block">Select Committee *</Label>
            <div className="flex flex-wrap gap-2">
              {committees.map((c) => (
                <button
                  key={c}
                  onClick={() => setCommittee(c)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    committee === c
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-muted text-muted-foreground border-border hover:border-accent/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Country Preference (optional)</Label>
            <Input value={countryPref} onChange={(e) => setCountryPref(e.target.value)} placeholder="e.g., France, India, USA" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs font-medium">MUN Experience</Label>
            <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Briefly describe your MUN experience..." className="mt-1 min-h-[80px]" />
          </div>
        </section>

        {/* Portfolio Upload */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-3">
          <h2 className="font-serif text-lg font-bold text-foreground">Portfolio (Optional)</h2>
          <label className="cursor-pointer block">
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-accent transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload portfolio (PDF/DOC)</p>
            </div>
          </label>
        </section>

        {/* Payment Summary */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card">
          <h2 className="font-serif text-lg font-bold text-foreground mb-3">Payment Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event Registration Fee</span>
              <span className="text-foreground">₹{eventFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="text-foreground">₹{platformFee}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-accent text-lg">₹{eventFee + platformFee}</span>
            </div>
          </div>
        </section>

        <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-medium h-12 text-sm" onClick={handleSubmit}>
          Pay ₹{eventFee + platformFee} & Register
        </Button>
      </div>
    </div>
  );
};

export default EventRegister;
