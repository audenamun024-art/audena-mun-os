import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Building2, CalendarPlus, ChevronDown, Globe, LayoutDashboard, Mail, MapPin, Phone, Plus, Save, Trash2, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { uploadPublicFile } from "@/lib/storage";
import { retryAsync, withTimeout } from "@/lib/async";

type SecretaryDraft = {
  id?: string;
  name: string;
  designation: string;
  phone: string;
  photo_url?: string | null;
  photoFile?: File | null;
  photoPreview?: string | null;
};

const MAX_SECRETARIES = 3;

const emptySecretary = (): SecretaryDraft => ({
  name: "",
  designation: "",
  phone: "",
  photo_url: null,
  photoFile: null,
  photoPreview: null,
});

const OrganizerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [organizer, setOrganizer] = useState<any>(null);
  const [eventCount, setEventCount] = useState(0);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    contact_email: "",
    website: "",
    place: "",
    city: "",
    state: "",
    country: "",
  });
  const [secretaries, setSecretaries] = useState<SecretaryDraft[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const stats = useMemo(
    () => [
      { label: "Drop", value: eventCount },
      { label: "Network", value: registrationCount },
      { label: "Connect", value: secretaries.length },
    ],
    [eventCount, registrationCount, secretaries.length]
  );

  const displayedPlace = useMemo(() => {
    if (form.place.trim()) return form.place.trim();
    return [form.city, form.state, form.country].filter(Boolean).join(", ");
  }, [form.city, form.country, form.place, form.state]);

  const fetchOrganizerData = async () => {
    if (!user) return;

    setLoading(true);
    setErrorState(null);

    try {
      const orgResult = (await retryAsync(
        () => withTimeout(supabase.from("organizers").select("*").eq("user_id", user.id).maybeSingle(), 15000, "Organisation request timed out"),
        1
      )) as any;
      const org = orgResult?.data;

      if (!org) {
        navigate("/organizer/register");
        return;
      }

      setOrganizer(org);
      setForm({
        name: org.name || "",
        description: org.description || "",
        contact_email: org.contact_email || "",
        website: org.website || "",
        place: (org as any).place || "",
        city: (org as any).city || "",
        state: (org as any).state || "",
        country: (org as any).country || "",
      });
      setLogoPreview(org.logo_url || null);

      const detailsResult = (await withTimeout(
        Promise.all([
          (supabase.from("secretaries" as any) as any).select("*").eq("organizer_id", org.id).order("created_at", { ascending: true }),
          supabase.from("events").select("id").eq("organizer_id", org.id),
        ]),
        15000,
        "Organisation details timed out"
      )) as any[];
      const secs = detailsResult?.[0]?.data;
      const eventRows = detailsResult?.[1]?.data;

      const eventIds = (eventRows || []).map((event: any) => event.id);
      let totalRegistrations = 0;
      if (eventIds.length > 0) {
        const registrationCountResult = (await withTimeout(
          supabase.from("registrations").select("id", { count: "exact", head: true }).in("event_id", eventIds),
          15000,
          "Registration count timed out"
        )) as any;
        totalRegistrations = registrationCountResult?.count || 0;
      }

      setEventCount(eventIds.length);
      setRegistrationCount(totalRegistrations);
      setSecretaries(
        ((secs as any[]) || []).map((secretary) => ({
          id: secretary.id,
          name: secretary.name,
          designation: secretary.designation,
          phone: secretary.phone || "",
          photo_url: secretary.photo_url || null,
          photoPreview: secretary.photo_url || null,
          photoFile: null,
        }))
      );
    } catch (error) {
      console.error(error);
      setErrorState("We couldn't load your organisation profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrganizerData();
  }, [user]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSecretaryPhoto = (index: number, file: File | null) => {
    if (!file) return;
    setSecretaries((current) =>
      current.map((secretary, currentIndex) =>
        currentIndex === index
          ? { ...secretary, photoFile: file, photoPreview: URL.createObjectURL(file) }
          : secretary
      )
    );
  };

  const addSecretary = () => {
    if (secretaries.length >= MAX_SECRETARIES) {
      toast.error(`Maximum ${MAX_SECRETARIES} secretaries allowed`);
      return;
    }
    setSecretaries((current) => [...current, emptySecretary()]);
  };

  const removeSecretary = (index: number) => setSecretaries((current) => current.filter((_, currentIndex) => currentIndex !== index));

  const updateSecretary = (index: number, field: keyof SecretaryDraft, value: string) => {
    setSecretaries((current) => current.map((secretary, currentIndex) => (currentIndex === index ? { ...secretary, [field]: value } : secretary)));
  };

  const handleSave = async () => {
    if (!organizer || !user) return;

    setSaving(true);
    setUploadProgress(5);

    try {
      let logoUrl = organizer.logo_url || null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        logoUrl = await uploadPublicFile({
          path: `${user.id}/organizer/logo-${Date.now()}.${ext}`,
          file: logoFile,
          onProgress: (value) => setUploadProgress(Math.round(value * 0.35)),
        });
      }

      const secretariesWithUploads = await Promise.all(
        secretaries.slice(0, MAX_SECRETARIES).map(async (secretary, index) => {
          let photoUrl = secretary.photo_url || null;
          if (secretary.photoFile) {
            const ext = secretary.photoFile.name.split(".").pop() || "jpg";
            photoUrl = await uploadPublicFile({
              path: `${user.id}/organizer/secretary-${index + 1}-${Date.now()}.${ext}`,
              file: secretary.photoFile,
              onProgress: (value) => setUploadProgress(35 + Math.round((value / 100) * 35)),
            });
          }

          return {
            organizer_id: organizer.id,
            name: secretary.name.trim(),
            designation: secretary.designation.trim(),
            phone: secretary.phone.trim() || null,
            photo_url: photoUrl,
          };
        })
      );

      setUploadProgress(75);

      const organizerPayload = {
        name: form.name,
        description: form.description,
        contact_email: form.contact_email,
        website: form.website,
        logo_url: logoUrl,
        place: form.place,
        city: form.city,
        state: form.state,
        country: form.country,
      };

      const organizerUpdateResult = (await withTimeout(
        (supabase.from("organizers").update(organizerPayload as any) as any).eq("id", organizer.id),
        15000,
        "Saving organisation timed out"
      )) as any;
      if (organizerUpdateResult?.error) throw organizerUpdateResult.error;

      const deleteSecretariesResult = (await withTimeout(
        (supabase.from("secretaries" as any) as any).delete().eq("organizer_id", organizer.id),
        15000,
        "Resetting secretaries timed out"
      )) as any;
      if (deleteSecretariesResult?.error) throw deleteSecretariesResult.error;

      const validSecretaries = secretariesWithUploads.filter((secretary) => secretary.name && secretary.designation);
      if (validSecretaries.length > 0) {
        const insertSecretariesResult = (await withTimeout(
          (supabase.from("secretaries" as any) as any).insert(validSecretaries),
          15000,
          "Saving secretaries timed out"
        )) as any;
        if (insertSecretariesResult?.error) throw insertSecretariesResult.error;
      }

      setUploadProgress(100);
      toast.success("Organisation profile updated");
      await fetchOrganizerData();
      setLogoFile(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save organisation profile");
    } finally {
      setSaving(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
          <Skeleton className="h-12 w-28 rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  if (errorState) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          <div className="bg-card rounded-3xl border border-border p-8 text-center space-y-4 shadow-card">
            <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Organisation profile unavailable</h1>
              <p className="text-sm text-muted-foreground">{errorState}</p>
            </div>
            <Button className="bg-gradient-primary text-primary-foreground" onClick={() => void fetchOrganizerData()}>
              Retry
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="relative">
            <Button size="icon" className="h-12 w-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-elevated" onClick={() => setQuickActionsOpen((open) => !open)}>
              <Plus className="h-5 w-5" />
            </Button>
            {quickActionsOpen && (
              <div className="absolute left-0 top-14 z-20 min-w-44 rounded-2xl border border-border bg-card p-2 shadow-elevated">
                <Link to="/events/create" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-secondary">
                  <CalendarPlus className="h-4 w-4 text-primary" /> Create Event
                </Link>
                <Link to="/organizer" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground hover:bg-secondary">
                  <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Organisation Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your public presence, location, and secretary information.</p>
          </div>
        </div>

        <section className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <button type="button" onClick={() => logoInputRef.current?.click()} className="w-24 h-24 rounded-3xl border border-border bg-secondary overflow-hidden flex items-center justify-center shrink-0">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              {logoPreview ? (
                <img src={logoPreview} alt={`${form.name || "Organisation"} logo`} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </button>

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{form.name || "Your Organisation"}</h2>
                {displayedPlace && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-primary" /> Place: {displayedPlace}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-center">
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {form.contact_email && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                    <Mail className="h-4 w-4 text-primary" /> {form.contact_email}
                  </span>
                )}
                {form.website && (
                  <a href={form.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 hover:text-foreground">
                    <Globe className="h-4 w-4 text-primary" /> Visit Website
                  </a>
                )}
              </div>

              {form.description && <p className="text-sm text-muted-foreground leading-6">{form.description}</p>}
            </div>
          </div>
        </section>

        <section className="bg-card rounded-3xl border border-border p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Information</h2>
              <p className="text-sm text-muted-foreground">Maximum 3 secretaries shown on your organisation page.</p>
            </div>
            {secretaries.length < MAX_SECRETARIES && (
              <Button variant="outline" className="rounded-xl" onClick={addSecretary}>
                <Plus className="h-4 w-4 mr-2" /> Add Secretary
              </Button>
            )}
          </div>

          {secretaries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No secretaries added yet.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {secretaries.slice(0, MAX_SECRETARIES).map((secretary, index) => (
                <article key={secretary.id || index} className="rounded-3xl border border-border bg-secondary/30 p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {secretary.photoPreview || secretary.photo_url ? (
                        <img src={secretary.photoPreview || secretary.photo_url || ""} alt={secretary.name || `Secretary ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{secretary.name || `Secretary ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{secretary.designation || "Role pending"}</p>
                    </div>
                  </div>

                  {secretary.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" /> {secretary.phone}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card rounded-3xl border border-border p-6 shadow-card space-y-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
            <p className="text-sm text-muted-foreground">Update your organisation details, location, and secretary cards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Organisation Name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contact Email</Label>
              <Input value={form.contact_email} onChange={(event) => setForm({ ...form, contact_email: event.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Place / Location</Label>
              <Input
                value={form.place}
                onChange={(event) => setForm({ ...form, place: event.target.value })}
                placeholder="Bhubaneswar, Odisha"
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Logo</Label>
              <button type="button" onClick={() => logoInputRef.current?.click()} className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary px-4 py-3 text-sm text-muted-foreground hover:border-primary/40">
                <Upload className="h-4 w-4" /> Change logo
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 min-h-[96px] bg-secondary border-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">State</Label>
              <Input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
          </div>
        </section>

        <section className="bg-card rounded-3xl border border-border p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Secretary Cards</h2>
              <p className="text-sm text-muted-foreground">Upload photo, name, role, and optional contact for each secretary.</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">{secretaries.length}/{MAX_SECRETARIES}</span>
          </div>

          <div className="space-y-4">
            {secretaries.map((secretary, index) => (
              <div key={secretary.id || index} className="rounded-3xl border border-border bg-secondary/30 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Secretary {index + 1}</p>
                    <p className="text-xs text-muted-foreground">Visible in the organisation information section.</p>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-destructive" onClick={() => removeSecretary(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[112px,1fr] gap-4 items-start">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => handleSecretaryPhoto(index, event.target.files?.[0] || null)} />
                    <div className="w-28 h-28 rounded-3xl border border-dashed border-border bg-card overflow-hidden flex items-center justify-center text-muted-foreground hover:border-primary/40">
                      {secretary.photoPreview || secretary.photo_url ? (
                        <img src={secretary.photoPreview || secretary.photo_url || ""} alt={secretary.name || `Secretary ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </div>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <Input value={secretary.name} onChange={(event) => updateSecretary(index, "name", event.target.value)} className="mt-1 bg-card border-border" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Designation / Role</Label>
                      <Input value={secretary.designation} onChange={(event) => updateSecretary(index, "designation", event.target.value)} className="mt-1 bg-card border-border" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">Contact (optional)</Label>
                      <Input value={secretary.phone} onChange={(event) => updateSecretary(index, "phone", event.target.value)} className="mt-1 bg-card border-border" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {saving && uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">Uploading files and saving organisation profile...</p>
            </div>
          )}

          <Button className="w-full h-12 bg-gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Organisation Profile"}
          </Button>
        </section>
      </div>
    </AppLayout>
  );
};

export default OrganizerProfile;
