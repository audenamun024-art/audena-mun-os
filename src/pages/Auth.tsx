import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building2, ArrowRight, Eye, EyeOff, Shield, Gavel, Award } from "lucide-react";
import AuthRoleQuickAccess, { TestRoleAccount } from "@/components/auth/AuthRoleQuickAccess";

const TEST_ACCOUNTS: TestRoleAccount[] = [
  { role: "Delegate", icon: User, email: "delegate.audena@example.com", password: "delegate123", description: "Browse events, register, earn points" },
  { role: "Organizer", icon: Gavel, email: "organizer.audena@example.com", password: "organizer123", description: "Create events, manage registrations" },
  { role: "Admin", icon: Shield, email: "admin.audena@example.com", password: "admin123", description: "Platform oversight and moderation" },
  { role: "EB Member", icon: Award, email: "eb.audena@example.com", password: "eb123456", description: "Crisis mode and event controls" },
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

  const ensureProfileAndRole = async (fallbackName: string, fallbackType: "personal" | "organisation") => {
    await supabase.rpc("ensure_profile_and_role" as any, { _full_name: fallbackName, _account_type: fallbackType });
  };

  const routeAfterLogin = async (userId: string) => {
    const [{ data: roleRows }, { data: profileRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("account_type").eq("user_id", userId).maybeSingle(),
    ]);
    const roles = new Set((roleRows || []).map((row: any) => row.role));
    if (roles.has("admin")) { navigate("/admin"); return; }
    if (roles.has("organizer")) { navigate("/organizer"); return; }
    if (roles.has("eb")) { navigate("/crisis"); return; }
    if ((profileRow as any)?.account_type === "organisation") { navigate("/organizer/register"); return; }
    navigate("/");
  };

  const handleAuth = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    if (mode === "signup" && !accountType) { toast.error("Please select an account type"); return; }
    if (mode === "signup" && !fullName) { toast.error("Please enter your name"); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, account_type: accountType }, emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session?.user) await ensureProfileAndRole(fullName, accountType || "personal");
        toast.success("Account created!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await ensureProfileAndRole(fullName || "", accountType || "personal");
        toast.success("Welcome back!");
        await routeAfterLogin(data.user.id);
      }
    } catch (err: any) { toast.error(err.message || "Authentication failed"); }
    finally { setLoading(false); }
  };

  const handleQuickRoleAccess = async (account: TestRoleAccount) => {
    setEmail(account.email); setPassword(account.password); setMode("login");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
      if (error) {
        if (error.message?.toLowerCase().includes("invalid login credentials")) {
          setMode("signup"); setAccountType(account.role === "Organizer" ? "organisation" : "personal"); setFullName(`Test ${account.role}`);
          toast.info("Test account not found. Pre-filled Sign Up."); return;
        }
        throw error;
      }
      await ensureProfileAndRole(`Test ${account.role}`, account.role === "Organizer" ? "organisation" : "personal");
      toast.success(`Signed in as ${account.role}`);
      await routeAfterLogin(data.user.id);
    } catch (err: any) { toast.error(err.message || "Quick access failed"); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-1"><span className="text-gradient-primary">AudenaMUN</span></h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">India's Premier MUN Platform</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-elevated">
          <div className="flex bg-secondary rounded-xl p-1 mb-5">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); if (m === "login") setAccountType(null); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "login" && <AuthRoleQuickAccess roles={TEST_ACCOUNTS} loading={loading} onRoleSelect={handleQuickRoleAccess} />}

          {mode === "signup" && !accountType && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-muted-foreground text-center mb-4">Choose your account type</p>
              {[
                { type: "personal" as const, icon: User, title: "Personal Use", desc: "Join as delegate" },
                { type: "organisation" as const, icon: Building2, title: "Organisation Use", desc: "Requires verification" },
              ].map((opt) => (
                <button key={opt.type} onClick={() => setAccountType(opt.type)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary hover:border-primary/40 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"><opt.icon className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 text-left"><p className="font-semibold text-sm text-foreground">{opt.title}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          )}

          {(mode === "login" || accountType) && (
            <div className="space-y-4 animate-fade-in">
              {mode === "signup" && accountType && (
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setAccountType(null)} className="text-xs text-primary hover:underline">← Change type</button>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{accountType === "personal" ? "Delegate" : "Organisation"}</span>
                </div>
              )}
              {mode === "signup" && (
                <div><Label className="text-xs font-medium text-muted-foreground">{accountType === "organisation" ? "Organisation Name" : "Full Name"}</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={accountType === "organisation" ? "Your institution name" : "Your full name"} className="mt-1.5 bg-secondary border-border h-11" /></div>
              )}
              <div><Label className="text-xs font-medium text-muted-foreground">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 bg-secondary border-border h-11" /></div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Password</Label>
                <div className="relative mt-1.5"><Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-secondary border-border h-11 pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              </div>
              <Button className="w-full bg-gradient-primary text-primary-foreground font-semibold h-11" onClick={handleAuth} disabled={loading}>
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : mode === "login" ? "Sign In" : accountType === "organisation" ? "Create Organisation Account" : "Create Account"}
              </Button>
              {mode === "login" && <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline w-full text-center block">Forgot password?</button>}
            </div>
          )}
        </div>
        <p className="text-center mt-6"><Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link></p>
      </div>
    </div>
  );
};

export default Auth;
