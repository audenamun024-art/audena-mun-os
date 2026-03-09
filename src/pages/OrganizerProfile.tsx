import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Building2, MapPin, Phone, User, Plus, Trash2, Save, Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Secretary {
  id?: string;
  name: string;
  designation: string;
  phone: string;
}

const OrganizerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizer, setOrganizer] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", contact_email: "", website: "", city: "", state: "", country: "" });
  const [secretaries, setSecretaries] = useState<Secretary[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: org } = await supabase.from("organizers").select("*").eq("user_id", user.id).maybeSingle();
      if (!org) { navigate("/organizer/register"); return; }
      setOrganizer(org);
      setForm({
        name: org.name || "", description: org.description || "", contact_email: org.contact_email || "",
        website: org.website || "", city: (org as any).city || "", state: (org as any).state || "", country: (org as any).country || "",
      });
      setLogoPreview(org.logo_url || null);

      const { data: secs } = await supabase.from("secretaries" as any).select("*").eq("organizer_id", org.id).order("created_at", { ascending: true });
      setSecretaries((secs as any[] || []).map((s: any) => ({ id: s.id, name: s.name, designation: s.designation, phone: s.phone || "" })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); const r = new FileReader(); r.onloadend = () => setLogoPreview(r.result as string); r.readAsDataURL(file); }
  };

  const addSecretary = () => {
    if (secretaries.length >= 3) { toast.error("Maximum 3 secretaries allowed"); return; }
    setSecretaries([...secretaries, { name: "", designation: "", phone: "" }]);
  };

  const updateSecretary = (i: number, field: keyof Secretary, value: string) => {
    const updated = [...secretaries];
    (updated[i] as any)[field] = value;
    setSecretaries(updated);
  };

  const removeSecretary = (i: number) => setSecretaries(secretaries.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!organizer || !user) return;
    setSaving(true);
    try {
      let logoUrl = organizer.logo_url;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        const path = `${user.id}/logos/${Date.now()}.${ext}`;
        await supabase.storage.from("uploads").upload(path, logoFile);
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("organizers").update({
        name: form.name, description: form.description, contact_email: form.contact_email,
        website: form.website, logo_url: logoUrl, city: form.city, state: form.state, country: form.country,
      } as any).eq("id", organizer.id);
      if (error) throw error;

      // Sync secretaries: delete all, re-insert
      await (supabase.from("secretaries" as any) as any).delete().eq("organizer_id", organizer.id);
      const validSecs = secretaries.filter(s => s.name.trim());
      if (validSecs.length > 0) {
        await (supabase.from("secretaries" as any) as any).insert(
          validSecs.map(s => ({ organizer_id: organizer.id, name: s.name, designation: s.designation, phone: s.phone }))
        );
      }

      toast.success("Profile updated successfully");
    } catch (err: any) { toast.error(err.message || "Save failed"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <div className="h-8 w-48 bg-secondary rounded-lg animate-pulse" />
        <div className="h-64 bg-secondary rounded-2xl animate-pulse" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Organisation Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your organisation details</p>
        </div>

        {/* Logo */}
        <section className="bg-card rounded-2xl border border-border p-5 shadow-card">
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
              <p className="text-sm font-medium text-foreground">Organisation Logo</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
          </label>
        </section>

        {/* Details */}
        <section className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Organisation Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Email</Label>
              <Input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Website</Label>
            <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-[80px] bg-secondary border-border" />
          </div>
        </section>

        {/* Place */}
        <section className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Place
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Bangalore" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">State</Label>
              <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="e.g. Karnataka" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="e.g. India" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
        </section>

        {/* Secretaries */}
        <section className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Information — Secretaries
            </h2>
            {secretaries.length < 3 && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 rounded-lg" onClick={addSecretary}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Maximum 3 secretaries</p>

          {secretaries.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No secretaries added</p>
            </div>
          ) : secretaries.map((sec, i) => (
            <div key={i} className="bg-secondary/50 rounded-xl p-4 space-y-3 relative">
              <button onClick={() => removeSecretary(i)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={sec.name} onChange={e => updateSecretary(i, "name", e.target.value)} placeholder="e.g. Ashwin Dimri" className="mt-1 bg-card border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Designation</Label>
                  <Input value={sec.designation} onChange={e => updateSecretary(i, "designation", e.target.value)} placeholder="e.g. USG Delegate Affairs" className="mt-1 bg-card border-border" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <Input value={sec.phone} onChange={e => updateSecretary(i, "phone", e.target.value)} placeholder="+91 XXXXXXXXXX" className="mt-1 bg-card border-border" />
              </div>
            </div>
          ))}
        </section>

        <Button className="w-full bg-gradient-primary text-primary-foreground font-medium h-12 gap-2" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default OrganizerProfile;
