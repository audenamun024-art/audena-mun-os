import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    setIsRecoverySession(hash.get("type") === "recovery");
  }, []);

  const handleResetPassword = async () => {
    if (!isRecoverySession) {
      toast.error("Invalid reset session. Use the link from your email.");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-gradient-gold">Reset Password</h1>
          <p className="text-xs text-muted-foreground mt-1">Set a new secure password for your account</p>
        </div>

        {!isRecoverySession ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Open the reset link from your email to continue.
            </p>
            <Link to="/auth" className="block">
              <Button className="w-full bg-accent text-accent-foreground hover:opacity-90">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">New Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-1.5 bg-secondary border-border h-11"
              />
            </div>

            <Button className="w-full bg-accent text-accent-foreground hover:opacity-90" onClick={handleResetPassword} disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
