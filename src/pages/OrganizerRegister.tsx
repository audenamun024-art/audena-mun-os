import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "", contactEmail: "", website: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); const reader = new FileReader(); reader.onloadend = () => setLogoPreview(reader.result as string); reader.readAsDataURL(file); }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactEmail) { toast.error("Please fill in all required fields"); return; }
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

      const { error } = await supabase.from("organizers").insert([{
        user_id: user.id,
        name: formData.name,
        description: formData.description,
        contact_email: formData.contactEmail,
        website: formData.website,
        logo_url: logoUrl,
      }]);
      if (error) throw error;

      await supabase.from("user_roles").insert([{ user_id: user.id, role: "organizer" as any }]);
      toast.success("Application submitted! You'll be notified once approved.");
      navigate("/organizer");
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 h-14 flex items-center gap-3">
        <Link to="/auth"><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <h1 className="text-lg font-bold text-foreground">Organizer Registration</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <section className="bg-card rounded-xl border border-border p-4 shadow-card">
          <label className="cursor-pointer flex items-center gap-4">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {logoPreview ? <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" /> : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"><Building2 className="h-6 w-6 text-muted-foreground" /></div>
            )}
            <div><p className="text-sm font-medium text-foreground">Upload Logo</p><p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p></div>
          </label>
        </section>

        <section className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
          <h2 className="text-base font-bold text-foreground">Organisation Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Organisation Name *</Label><Input value={formData.name} onChange={(e) => update("name", e.target.value)} placeholder="Presidency University MUN" className="mt-1 bg-secondary border-border" /></div>
            <div><Label className="text-xs text-muted-foreground">Contact Email *</Label><Input type="email" value={formData.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="admin@institution.edu" className="mt-1 bg-secondary border-border" /></div>
          </div>
          <div><Label className="text-xs text-muted-foreground">Website</Label><Input value={formData.website} onChange={(e) => update("website", e.target.value)} placeholder="https://yourmun.org" className="mt-1 bg-secondary border-border" /></div>
          <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={formData.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell us about your organisation..." className="mt-1 min-h-[80px] bg-secondary border-border" /></div>
        </section>

        <Button className="w-full bg-gradient-primary text-primary-foreground font-medium h-12" onClick={handleSubmit} disabled={loading}>{loading ? "Submitting..." : "Submit for Approval"}</Button>
        <p className="text-xs text-center text-muted-foreground pb-4">Your application will be reviewed by the AudenaMUN admin team.</p>
      </div>
    </div>
  );
};

export default OrganizerRegister;
