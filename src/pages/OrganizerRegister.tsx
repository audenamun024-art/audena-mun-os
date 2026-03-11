import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Upload, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadPublicFile } from "@/lib/storage";

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [formData, setFormData] = useState({ name: "", description: "", contactEmail: "", website: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const update = (field: string, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      if (!user) {
        toast.error("Please sign in first");
        navigate("/auth");
        return;
      }

      let logoUrl = "";
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        logoUrl = await uploadPublicFile({
          path: `${user.id}/logos/${Date.now()}.${ext}`,
          file: logoFile,
          onProgress: setUploadProgress,
        });
      }

      const { error } = await supabase.from("organizers").insert([
        {
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          contact_email: formData.contactEmail,
          website: formData.website,
          logo_url: logoUrl,
        },
      ]);
      if (error) throw error;

      const roleResult = await supabase.from("user_roles").insert([{ user_id: user.id, role: "organizer" as any }]);
      if ((roleResult as any).error && (roleResult as any).error.code !== "23505") {
        throw (roleResult as any).error;
      }

      await refresh();
      toast.success("Application submitted! Your organisation profile is ready.");
      navigate("/organizer/profile");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Organizer Registration</h1>
          <p className="text-sm text-muted-foreground">Register your institution to host MUN events</p>
        </div>

        <section className="bg-card rounded-xl border border-border p-4 shadow-card">
          <label className="cursor-pointer flex items-center gap-4">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Upload Logo</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 50MB</p>
            </div>
          </label>
        </section>

        <section className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
          <h2 className="text-base font-bold text-foreground">Organisation Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Organisation Name *</Label>
              <Input value={formData.name} onChange={(event) => update("name", event.target.value)} placeholder="Presidency University MUN" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Email *</Label>
              <Input type="email" value={formData.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="admin@institution.edu" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Website</Label>
            <Input value={formData.website} onChange={(event) => update("website", event.target.value)} placeholder="https://yourmun.org" className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={formData.description} onChange={(event) => update("description", event.target.value)} placeholder="Tell us about your organisation..." className="mt-1 min-h-[80px] bg-secondary border-border" />
          </div>

          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">Uploading logo...</p>
            </div>
          )}
        </section>

        <Button className="w-full bg-gradient-primary text-primary-foreground font-medium h-12" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit for Approval"}
        </Button>
        <p className="text-xs text-center text-muted-foreground pb-4">Your application will be reviewed by the AudenaMUN admin team.</p>
      </div>
    </AppLayout>
  );
};

export default OrganizerRegister;
