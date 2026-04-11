import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { User, Building2, ArrowRight, Eye, EyeOff, Shield, Gavel, Award, Mail, Loader2 } from "lucide-react";
import AuthRoleQuickAccess, { TestRoleAccount } from "@/components/auth/AuthRoleQuickAccess";

const TEST_ACCOUNTS: TestRoleAccount[] = [
  { role: "Delegate", icon: User, email: "delegate@audena.test", password: "delegate123", description: "Browse events, register, earn points" },
  { role: "Organizer", icon: Gavel, email: "organizer@audena.test", password: "organizer123", description: "Create events, manage registrations" },
  { role: "Admin", icon: Shield, email: "admin@audena.test", password: "admin123!", description: "Platform oversight and moderation" },
  { role: "EB Member", icon: Award, email: "eb@audena.test", password: "eb123456!", description: "Crisis mode and event controls" },
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
  const { refresh } = useAuth();

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number>(0);

  const ensureProfileAndRole = async (name: string, type: "personal" | "organisation") => {
    await supabase.rpc("ensure_profile_and_role" as any, { _full_name: name, _account_type: type });
  };

  const routeAfterLogin = async (userId: string) => {
    const [{ data: roleRows }, { data: profileRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("account_type").eq("user_id", userId).maybeSingle(),
    ]);
    const roles = new Set((roleRows || []).map((row: any) => row.role));
    await refresh();
    if (roles.has("admin")) { navigate("/admin"); return; }
    if (roles.has("organizer")) { navigate("/organizer"); return; }
    if (roles.has("eb")) { navigate("/crisis"); return; }
    if ((profileRow as any)?.account_type === "organisation") { navigate("/organizer/register"); return; }
    navigate("/");
  };

  const generateOtpCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOtp = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    if (!password) { toast.error("Please enter a password"); return; }
    if (!fullName) { toast.error("Please enter your name"); return; }
    if (!accountType) { toast.error("Please select account type"); return; }

    setSendingOtp(true);
    const code = generateOtpCode();
    setGeneratedOtp(code);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ email, otp: code }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setOtpStep(true);
      setOtpExpiry(Date.now() + 10 * 60 * 1000);
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Could not send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtpAndSignup = async () => {
    if (otp !== generatedOtp) {
      toast.error("Invalid verification code");
      return;
    }
    if (Date.now() > otpExpiry) {
      toast.error("Code has expired. Please request a new one.");
      setOtpStep(false);
      setOtp("");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, account_type: accountType } },
      });
      if (error) throw error;
      if (data.user) {
        await ensureProfileAndRole(fullName, accountType || "personal");
        toast.success("Account created!");
        await routeAfterLogin(data.user.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) { toast.error("Please fill in all fields"); return; }

    if (mode === "signup") {
      if (!accountType) { toast.error("Please select an account type"); return; }
      if (!fullName) { toast.error("Please enter your name"); return; }
      await sendOtp();
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      await routeAfterLogin(data.user.id);
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleAccess = async (account: TestRoleAccount) => {
    setEmail(account.email); setPassword(account.password); setMode("login");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: account.email, password: account.password });
      if (error) {
        const acctType = account.role === "Organizer" ? "organisation" as const : "personal" as const;
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: account.email, password: account.password,
          options: { data: { full_name: `Test ${account.role}`, account_type: acctType } },
        });
        if (signUpErr) throw signUpErr;
        if (!signUpData.user) throw new Error("Signup failed");
        await ensureProfileAndRole(`Test ${account.role}`, acctType);
        if (account.role === "Admin") await supabase.from("user_roles").insert([{ user_id: signUpData.user.id, role: "admin" as any }]);
        if (account.role === "EB Member") await supabase.from("user_roles").insert([{ user_id: signUpData.user.id, role: "eb" as any }]);
        if (account.role === "Organizer") {
          await supabase.from("user_roles").insert([{ user_id: signUpData.user.id, role: "organizer" as any }]);
          await supabase.from("organizers").insert([{ user_id: signUpData.user.id, name: "Test Organisation", contact_email: account.email, status: "approved" as any }]);
        }
        toast.success(`Created & signed in as ${account.role}`);
        await refresh();
        await routeAfterLogin(signUpData.user.id);
        return;
      }
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">
            <span className="text-primary">Audena</span><span className="text-foreground">Hub</span>
          </h1>
          <p className="text-xs text-muted-foreground tracking-[0.25em] uppercase font-medium">
            India's Premier MUN Platform
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-elevated">
          {/* OTP Verification Step */}
          {otpStep ? (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Verify Your Email</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold h-11 rounded-xl transition-all"
                onClick={verifyOtpAndSignup}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <div className="flex items-center justify-between">
                <button onClick={() => { setOtpStep(false); setOtp(""); }} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  ← Back
                </button>
                <button
                  onClick={sendOtp}
                  disabled={sendingOtp}
                  className="text-xs text-primary hover:underline font-medium disabled:opacity-50"
                >
                  {sendingOtp ? "Sending..." : "Resend Code"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex bg-secondary rounded-xl p-1 mb-6">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); if (m === "login") setAccountType(null); }}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      mode === m
                        ? "bg-gradient-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              {mode === "login" && (
                <AuthRoleQuickAccess roles={TEST_ACCOUNTS} loading={loading} onRoleSelect={handleQuickRoleAccess} />
              )}

              {mode === "signup" && !accountType && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm text-muted-foreground text-center mb-4">Choose your account type</p>
                  {[
                    { type: "personal" as const, icon: User, title: "Delegate", desc: "Join as a delegate" },
                    { type: "organisation" as const, icon: Building2, title: "Organisation", desc: "Host MUN events" },
                  ].map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => setAccountType(opt.type)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-secondary hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <opt.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm text-foreground">{opt.title}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {(mode === "login" || accountType) && (
                <div className="space-y-4 animate-fade-in">
                  {mode === "signup" && accountType && (
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => setAccountType(null)} className="text-xs text-primary hover:underline font-medium">
                        ← Change type
                      </button>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
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
                        className="mt-1.5 bg-secondary border-border h-11 focus:border-primary focus:ring-primary"
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
                      className="mt-1.5 bg-secondary border-border h-11 focus:border-primary focus:ring-primary"
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
                        className="bg-secondary border-border h-11 pr-10 focus:border-primary focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold h-11 rounded-xl transition-all"
                    onClick={handleAuth}
                    disabled={loading || sendingOtp}
                  >
                    {loading || sendingOtp ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      mode === "login" ? "Sign In" : "Send Verification Code"
                    )}
                  </Button>

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-muted-foreground hover:text-primary w-full text-center block transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center mt-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
