import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building2, ArrowRight, Eye, EyeOff, Shield, Gavel, Users, Award } from "lucide-react";

const TEST_ACCOUNTS = [
  {
    role: "Delegate",
    icon: User,
    email: "delegate@audena.test",
    password: "delegate123",
    description: "Browse events, register, earn points",
  },
  {
    role: "Organizer",
    icon: Gavel,
    email: "organizer@audena.test",
    password: "organizer123",
    description: "Create events, manage registrations",
  },
  {
    role: "Admin",
    icon: Shield,
    email: "admin@audena.test",
    password: "admin123",
    description: "Platform oversight, approvals",
  },
  {
    role: "EB Member",
    icon: Award,
    email: "eb@audena.test",
    password: "eb123456",
    description: "Crisis mode, event management",
  },
];

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

  const handleQuickLogin = async (testEmail: string, testPassword: string, role: string) => {
    setLoading(true);
    try {
      // First try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        // If user doesn't exist, create account
        const { error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: { full_name: `Test ${role}`, account_type: "personal" },
          },
        });
        if (signUpError) throw signUpError;

        // Try sign in again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        if (retryError) {
          toast.info(`Account created for ${role}. Check email to verify, then sign in.`);
          setLoading(false);
          return;
        }
      }

      toast.success(`Signed in as ${role}`);

      // Route based on role
      if (role === "Admin") navigate("/admin");
      else if (role === "Organizer") navigate("/organizer");
      else if (role === "EB Member") navigate("/crisis");
      else navigate("/");
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

          {/* Quick Login - Test Accounts (Login mode only) */}
          {mode === "login" && (
            <div className="mb-5 animate-fade-in">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3 text-center">Quick Access — Test Roles</p>
              <div className="grid grid-cols-2 gap-2">
                {TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    onClick={() => handleQuickLogin(acc.email, acc.password, acc.role)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-secondary hover:border-accent/40 hover:bg-secondary/80 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <acc.icon className="h-4.5 w-4.5 text-accent" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{acc.role}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center">{acc.description}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground">or sign in manually</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            </div>
          )}

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
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                    {accountType === "personal" ? "Delegate" : "Organisation"}
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
