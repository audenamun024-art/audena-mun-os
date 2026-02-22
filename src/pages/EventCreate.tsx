import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, MapPin, Plus, Trash2, Upload, ArrowLeft, DollarSign, Users, Clock
} from "lucide-react";
import { toast } from "sonner";

interface Committee {
  name: string;
  agenda: string;
  capacity: number;
}

const EventCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fee, setFee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([
    { name: "", agenda: "", capacity: 30 },
  ]);

  const platformFee = 25;

  const addCommittee = () => {
    setCommittees([...committees, { name: "", agenda: "", capacity: 30 }]);
  };

  const removeCommittee = (index: number) => {
    if (committees.length > 1) {
      setCommittees(committees.filter((_, i) => i !== index));
    }
  };

  const updateCommittee = (index: number, field: keyof Committee, value: string | number) => {
    const updated = [...committees];
    updated[index] = { ...updated[index], [field]: value };
    setCommittees(updated);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    if (!title || !location || !startDate || !endDate || !fee) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (committees.some((c) => !c.name)) {
      toast.error("All committees must have a name");
      return;
    }
    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    toast.success("Event published! Public page generated.");
    navigate(`/events/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-gradient border-b border-navy-light px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/organizer">
              <Button size="sm" variant="ghost" className="text-gold-light hover:bg-navy-light h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="font-serif text-lg font-bold text-gold-light">Create Event</h1>
          </div>
          <Button size="sm" onClick={handlePublish} className="bg-accent text-accent-foreground hover:bg-gold-dark text-xs">
            Publish Event
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Banner Upload */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card">
          <Label className="text-sm font-semibold text-foreground mb-3 block">Event Banner</Label>
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
            {bannerPreview ? (
              <div className="relative rounded-lg overflow-hidden h-48">
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-navy-dark/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="h-8 w-8 text-gold-light" />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg h-48 flex flex-col items-center justify-center gap-2 hover:border-accent transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload banner image</p>
                <p className="text-xs text-muted-foreground">Recommended: 1200×400px</p>
              </div>
            )}
          </label>
        </section>

        {/* Basic Details */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground">Event Details</h2>

          <div>
            <Label className="text-xs font-medium">Event Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Delhi International MUN 2026" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs font-medium">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your event..." className="mt-1 min-h-[100px]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Location *</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New Delhi" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium flex items-center gap-1"><DollarSign className="h-3 w-3" /> Registration Fee (₹) *</Label>
              <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="1200" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium flex items-center gap-1"><Calendar className="h-3 w-3" /> End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Registration Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1" />
            </div>
          </div>

          {fee && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Fee Breakdown:</p>
              <div className="flex justify-between mt-1">
                <span className="text-foreground">Event Fee</span>
                <span className="font-medium text-foreground">₹{fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground">Platform Fee</span>
                <span className="font-medium text-foreground">₹{platformFee}</span>
              </div>
              <div className="flex justify-between border-t border-border mt-2 pt-2">
                <span className="font-semibold text-foreground">Total for Delegate</span>
                <span className="font-bold text-accent">₹{Number(fee) + platformFee}</span>
              </div>
            </div>
          )}
        </section>

        {/* Committees */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-foreground">Committees</h2>
            <Button size="sm" variant="outline" onClick={addCommittee} className="text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Committee
            </Button>
          </div>

          {committees.map((committee, index) => (
            <div key={index} className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Committee {index + 1}</span>
                {committees.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={() => removeCommittee(index)} className="h-7 w-7 p-0 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Committee Name *</Label>
                  <Input
                    value={committee.name}
                    onChange={(e) => updateCommittee(index, "name", e.target.value)}
                    placeholder="e.g., UNSC, DISEC, WHO"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1"><Users className="h-3 w-3" /> Capacity</Label>
                  <Input
                    type="number"
                    value={committee.capacity}
                    onChange={(e) => updateCommittee(index, "capacity", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium">Agenda</Label>
                <Textarea
                  value={committee.agenda}
                  onChange={(e) => updateCommittee(index, "agenda", e.target.value)}
                  placeholder="e.g., Addressing Nuclear Proliferation"
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          ))}
        </section>

        {/* Publish */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => toast.info("Draft saved!")}>
            Save Draft
          </Button>
          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-gold-dark" onClick={handlePublish}>
            Publish Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;
