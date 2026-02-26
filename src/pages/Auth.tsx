import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building2, ArrowRight, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [accountType, setAccountType] = useState<"personal" | "organisation" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (mode === "signup" && !accountType) {
      toast.error("Please select an account type");
      return;
    }
    if (mode === "signup" && !fullName) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        toast.success("Account created! Check your email to verify.");

        // If org, redirect to org registration after signup
        if (accountType === "organisation") {
          toast.info("Complete your organisation verification next.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-gradient-gold mb-1">AudenaMUN</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">India's Premier MUN Platform</p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-card">
          {/* Tab Switcher */}
          <div className="flex bg-secondary rounded-xl p-1 mb-5">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setAccountType(null); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Account Type Selection (Sign Up only) */}
          {mode === "signup" && !accountType && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-muted-foreground text-center mb-4">Choose your account type</p>
              <button
                onClick={() => setAccountType("personal")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary hover:border-accent/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-foreground">Personal Use</p>
                  <p className="text-xs text-muted-foreground">Join as a delegate, participate in events</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </button>
              <button
                onClick={() => setAccountType("organisation")}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary hover:border-accent/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-foreground">Organisation</p>
                  <p className="text-xs text-muted-foreground">Host events, manage committees & EB</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </button>
            </div>
          )}

          {/* Auth Form */}
          {(mode === "login" || accountType) && (
            <div className="space-y-4 animate-fade-in">
              {mode === "signup" && accountType && (
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setAccountType(null)}
                    className="text-xs text-accent hover:underline"
                  >
                    ← Change type
                  </button>
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium capitalize">
                    {accountType === "personal" ? "👤 Personal" : "🏛 Organisation"}
                  </span>
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">
                    {accountType === "organisation" ? "Organisation Name" : "Full Name"}
                  </Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={accountType === "organisation" ? "Your institution name" : "Your full name"}
                    className="mt-1.5 bg-secondary border-border h-11"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 bg-secondary border-border h-11"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-secondary border-border h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="w-full bg-accent text-accent-foreground hover:opacity-90 font-semibold h-11"
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                ) : mode === "login" ? "Sign In" : accountType === "organisation" ? "Create Organisation Account" : "Create Account"}
              </Button>

              {mode === "signup" && accountType === "organisation" && (
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Organisation accounts require verification. You'll complete your profile after sign-up.
                </p>
              )}

              {mode === "login" && (
                <button className="text-xs text-accent hover:underline w-full text-center block">
                  Forgot password?
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
