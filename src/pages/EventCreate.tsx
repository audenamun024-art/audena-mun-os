import AppLayout from "@/components/layout/AppLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, Plus, Trash2, Upload, DollarSign, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadPublicFile } from "@/lib/storage";
import { withTimeout } from "@/lib/async";

interface Committee {
  name: string;
  agenda: string;
  capacity: number;
}

const EventCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fee, setFee] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([{ name: "", agenda: "", capacity: 30 }]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const platformFee = 25;

  const addCommittee = () => setCommittees([...committees, { name: "", agenda: "", capacity: 30 }]);
  const removeCommittee = (index: number) => {
    if (committees.length > 1) setCommittees(committees.filter((_, currentIndex) => currentIndex !== index));
  };
  const updateCommittee = (index: number, field: keyof Committee, value: string | number) => {
    const updated = [...committees];
    updated[index] = { ...updated[index], [field]: value };
    setCommittees(updated);
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handlePublish = async () => {
    if (!title || !location || !startDate || !endDate || !fee) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (committees.some((committee) => !committee.name.trim())) {
      toast.error("All committees must have a name");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      if (!user) {
        toast.error("Please sign in");
        navigate("/auth");
        return;
      }

      const { data: org } = await withTimeout(
        supabase.from("organizers").select("id").eq("user_id", user.id).maybeSingle(),
        15000,
        "Organisation lookup timed out"
      );
      if (!org) {
        toast.error("Register as organizer first");
        navigate("/organizer/register");
        return;
      }

      let bannerUrl = "";
      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop() || "jpg";
        bannerUrl = await uploadPublicFile({
          path: `${user.id}/events/${Date.now()}.${ext}`,
          file: bannerFile,
          onProgress: setUploadProgress,
        });
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data: eventData, error: eventErr } = await withTimeout(
        supabase.from("events").insert([
          {
            organizer_id: org.id,
            title,
            slug,
            description,
            location,
            banner_url: bannerUrl,
            start_date: startDate,
            end_date: endDate,
            registration_fee: parseInt(fee, 10),
            platform_fee: platformFee,
            status: "published" as any,
          },
        ]).select().maybeSingle(),
        15000,
        "Event creation timed out"
      );
      if (eventErr) throw eventErr;
      if (!eventData) throw new Error("Event was not created");

      await withTimeout(
        Promise.all(
          committees.map((committee) =>
            supabase.from("committees").insert([
              {
                event_id: eventData.id,
                name: committee.name,
                agenda: committee.agenda,
                capacity: committee.capacity,
              },
            ])
          )
        ),
        15000,
        "Committee creation timed out"
      );

      toast.success("Event published!");
      navigate(`/events/${eventData.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create event");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 400);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Create Event</h1>
            <p className="text-sm text-muted-foreground">Set up your MUN conference</p>
          </div>
          <Button size="sm" onClick={handlePublish} disabled={loading} className="bg-gradient-primary text-primary-foreground text-xs">
            {loading ? "Publishing..." : "Publish"}
          </Button>
        </div>

        <section className="bg-card rounded-xl border border-border p-4 shadow-card">
          <Label className="text-xs text-muted-foreground mb-2 block">Event Banner</Label>
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            {bannerPreview ? (
              <div className="relative rounded-lg overflow-hidden h-44">
                <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg h-44 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload banner image</p>
              </div>
            )}
          </label>
          {loading && uploadProgress > 0 && (
            <div className="space-y-2 mt-4">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">Uploading event image...</p>
            </div>
          )}
        </section>

        <section className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
          <h2 className="text-base font-bold text-foreground">Event Details</h2>
          <div>
            <Label className="text-xs text-muted-foreground">Title *</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Delhi International MUN 2026" className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe your event..." className="mt-1 min-h-[100px] bg-secondary border-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location *</Label>
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="New Delhi" className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Fee (₹) *</Label>
              <Input type="number" value={fee} onChange={(event) => setFee(event.target.value)} placeholder="1200" className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start *</Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> End *</Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 bg-secondary border-border" />
            </div>
          </div>
          {fee && (
            <div className="bg-secondary rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Event Fee</span><span>₹{fee}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platform Fee</span><span>₹{platformFee}</span></div>
              <div className="flex justify-between border-t border-border mt-2 pt-2"><span className="font-semibold">Delegate Total</span><span className="font-bold text-primary">₹{Number(fee) + platformFee}</span></div>
            </div>
          )}
        </section>

        <section className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Committees</h2>
            <Button size="sm" variant="outline" onClick={addCommittee} className="text-xs border-border"><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
          </div>
          {committees.map((committee, index) => (
            <div key={index} className="bg-secondary rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Committee {index + 1}</span>
                {committees.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeCommittee(index)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Name *</Label>
                  <Input value={committee.name} onChange={(event) => updateCommittee(index, "name", event.target.value)} placeholder="UNSC" className="mt-1 bg-card border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Capacity</Label>
                  <Input type="number" value={committee.capacity} onChange={(event) => updateCommittee(index, "capacity", parseInt(event.target.value, 10) || 0)} className="mt-1 bg-card border-border" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Agenda</Label>
                <Textarea value={committee.agenda} onChange={(event) => updateCommittee(index, "agenda", event.target.value)} placeholder="Agenda topic..." className="mt-1 min-h-[60px] bg-card border-border" />
              </div>
            </div>
          ))}
        </section>

        <div className="flex gap-3 pb-6">
          <Button variant="outline" className="flex-1 border-border" onClick={() => toast.info("Draft saved!")}>Save Draft</Button>
          <Button className="flex-1 bg-gradient-primary text-primary-foreground" onClick={handlePublish} disabled={loading}>{loading ? "Publishing..." : "Publish Event"}</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default EventCreate;
