import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Building2 } from "lucide-react";
import { toast } from "sonner";

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institutionName: "", location: "", contactPerson: "",
    email: "", phone: "", password: "", confirmPassword: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.institutionName || !formData.email || !formData.contactPerson || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    toast.success("Application submitted! You'll receive an email once approved by admin.");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy-gradient border-b border-navy-light px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/auth">
            <Button size="sm" variant="ghost" className="text-gold-light hover:bg-navy-light h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-serif text-lg font-bold text-gold-light">Organizer Registration</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Logo Upload */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card">
          <Label className="text-sm font-semibold text-foreground mb-3 block">Institution Logo</Label>
          <label className="cursor-pointer flex items-center gap-4">
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-accent transition-colors">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Upload Logo</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
            </div>
          </label>
        </section>

        {/* Details */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground">Institution Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Institution Name *</Label>
              <Input value={formData.institutionName} onChange={(e) => update("institutionName", e.target.value)} placeholder="e.g., Presidency University" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Location *</Label>
              <Input value={formData.location} onChange={(e) => update("location", e.target.value)} placeholder="City, State" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Contact Person *</Label>
              <Input value={formData.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} placeholder="admin@institution.edu" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Phone</Label>
            <Input value={formData.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91 98765 43210" className="mt-1" />
          </div>
        </section>

        {/* Security */}
        <section className="bg-card rounded-xl border border-border p-5 shadow-card space-y-4">
          <h2 className="font-serif text-lg font-bold text-foreground">Set Password</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Password *</Label>
              <Input type="password" value={formData.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">Confirm Password *</Label>
              <Input type="password" value={formData.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
          </div>
        </section>

        <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-medium h-12" onClick={handleSubmit}>
          Submit for Approval
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your application will be reviewed by the AudenaMUN admin team. You'll receive an email notification once approved.
        </p>
      </div>
    </div>
  );
};

export default OrganizerRegister;
