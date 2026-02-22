import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institutionName: "", location: "", contactPerson: "", email: "", phone: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.institutionName || !formData.email || !formData.contactPerson) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in first"); navigate("/auth"); return; }

      let logoUrl = "";
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logos/${Date.now()}.${ext}`;
        await supabase.storage.from("uploads").upload(path, logoFile);
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("organizers").insert({
        user_id: user.id,
        institution_name: formData.institutionName,
        location: formData.location,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        logo_url: logoUrl,
      });
      if (error) throw error;

      // Add organizer role
      await supabase.from("user_roles").insert({ user_id: user.id, role: "organizer" as any });

      toast.success("Application submitted! You'll be notified once approved.");
      navigate("/organizer");
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-12 flex items-center gap-3">
        <Link to="/auth">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="font-serif text-lg font-bold text-foreground">Organizer Registration</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Logo */}
        <section className="bg-card rounded-xl border border-border p-4">
          <label className="cursor-pointer flex items-center gap-4">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-accent/50 transition-colors">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Upload Logo</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
            </div>
          </label>
        </section>

        {/* Details */}
        <section className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-serif text-base font-bold text-foreground">Institution Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Institution Name *</Label>
              <Input value={formData.institutionName} onChange={(e) => update("institutionName", e.target.value)} placeholder="Presidency University" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input value={formData.location} onChange={(e) => update("location", e.target.value)} placeholder="City, State" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Contact Person *</Label>
              <Input value={formData.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} placeholder="Full name" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} placeholder="admin@institution.edu" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input value={formData.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1 bg-secondary border-border" />
          </div>
        </section>

        <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-medium h-12" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit for Approval"}
        </Button>

        <p className="text-xs text-center text-muted-foreground pb-4">
          Your application will be reviewed by the AudenaMUN admin team.
        </p>
      </div>
    </div>
  );
};

export default OrganizerRegister;
