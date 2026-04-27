import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowRight, Eye, EyeOff, Mail, Loader2, User, Lock, AtSign,
  Globe2, Sparkles as SparklesIcon, ShieldCheck, MessagesSquare,
} from "lucide-react";
import audenaLogo from "@/assets/audena-logo.jpg";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState<number>(0);

  const ensureProfile = async (name: string) => {
    await supabase.rpc("ensure_profile_and_role" as any, { _full_name: name });
  };

  const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtp = async () => {
    if (!email || !password || !fullName) { toast.error("Fill in all fields first"); return; }
    setSendingOtp(true);
    const code = generateOtpCode();
    setGeneratedOtp(code);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpStep(true);
      setOtpExpiry(Date.now() + 10 * 60 * 1000);
      toast.success("Verification code sent");
    } catch (err: any) {
      toast.error(err.message || "Could not send code");
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtpAndSignup = async () => {
    if (otp !== generatedOtp) { toast.error("Invalid code"); return; }
    if (Date.now() > otpExpiry) { toast.error("Code expired"); setOtpStep(false); setOtp(""); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      if (data.user) {
        await ensureProfile(fullName);
        toast.success("Welcome to Audena Hub!");
        await refresh();
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) { toast.error("Fill in all fields"); return; }
    if (mode === "signup") {
      if (!fullName) { toast.error("Enter your name"); return; }
      await sendOtp();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      await refresh();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    toast.success("Reset link sent.");
  };

  return (
    <div className="min-h-screen w-full bg-[hsl(222_47%_4%)] text-foreground relative overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/20 rounded-full blur-[160px] animate-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-[-15%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left – Brand panel (desktop) */}
        <aside className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white ring-1 ring-primary/30 shadow-glow">
              <img src={audenaLogo} alt="Audena Hub" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-display font-bold tracking-tight">
                <span className="text-foreground">Audena</span>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hub</span>
              </p>
              <p className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase">MUN · Diplomacy · Network</p>
            </div>
          </div>

          <div className="space-y-8 max-w-md">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-primary/80 mb-4">
                <span className="h-px w-6 bg-primary/60" /> The Diplomatic Network
              </p>
              <h1 className="text-4xl xl:text-5xl font-display font-bold leading-[1.05] tracking-tight">
                Where the next generation of <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">global leaders</span> meet.
              </h1>
              <p className="mt-5 text-[15px] text-muted-foreground leading-relaxed">
                Discover Model UN events, debate with delegates worldwide, share moments
                from the floor, and build a diplomatic portfolio that travels with you.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Globe2, title: "Global MUN Calendar", desc: "Discover and register for conferences worldwide." },
                { icon: MessagesSquare, title: "Delegate-to-Delegate Chat", desc: "Connect with peers and committee partners instantly." },
                { icon: ShieldCheck, title: "Verified Profiles", desc: "Showcase awards, committees and country assignments." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-primary/30">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Audena Hub</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Trusted by delegates globally
            </span>
          </div>
        </aside>

        {/* Right – Auth card */}
        <main className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-[420px]">
            {/* Mobile brand */}
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white ring-1 ring-primary/30 overflow-hidden shadow-glow mb-3">
                <img src={audenaLogo} alt="Audena Hub" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-display font-bold">
                <span className="text-foreground">Audena</span>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hub</span>
              </h2>
              <p className="text-[10px] text-muted-foreground tracking-[0.3em] uppercase mt-1">MUN · Diplomacy · Network</p>
            </div>

            <div className="relative rounded-3xl border border-white/10 bg-[hsl(222_40%_8%/0.7)] backdrop-blur-2xl shadow-elevated p-7 sm:p-8">
              {/* glow ring */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none ring-1 ring-inset ring-primary/10" />

              {otpStep ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3 ring-1 ring-primary/40">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-display font-bold text-foreground">Verify your email</h2>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Enter the 6-digit code sent to <span className="font-medium text-primary">{email}</span>
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 font-semibold h-12 rounded-xl shadow-glow"
                    onClick={verifyOtpAndSignup}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
                  </Button>

                  <div className="flex items-center justify-between">
                    <button onClick={() => { setOtpStep(false); setOtp(""); }} className="text-xs text-muted-foreground hover:text-primary">← Back</button>
                    <button onClick={sendOtp} disabled={sendingOtp} className="text-xs text-primary hover:underline font-medium disabled:opacity-50">
                      {sendingOtp ? "Sending..." : "Resend code"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <p className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-primary/80 mb-2">
                      <SparklesIcon className="h-3 w-3" /> Welcome
                    </p>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      {mode === "login" ? "Sign in to your hub" : "Join Audena Hub"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {mode === "login"
                        ? "Continue your diplomatic journey."
                        : "Create your delegate profile in under a minute."}
                    </p>
                  </div>

                  {/* Toggle */}
                  <div className="relative flex bg-secondary/60 rounded-2xl p-1 mb-6 border border-white/5">
                    <span
                      className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow transition-all duration-300 ${
                        mode === "login" ? "left-1" : "left-[calc(50%+0rem)]"
                      }`}
                    />
                    {(["login", "signup"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-300 ${
                          mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m === "login" ? "Sign In" : "Sign Up"}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3.5 animate-fade-in">
                    {mode === "signup" && (
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="bg-white/[0.03] border-white/10 h-12 pl-10 rounded-xl focus:border-primary focus:ring-primary/30 placeholder:text-muted-foreground/70"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="bg-white/[0.03] border-white/10 h-12 pl-10 rounded-xl focus:border-primary focus:ring-primary/30 placeholder:text-muted-foreground/70"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="bg-white/[0.03] border-white/10 h-12 pl-10 pr-10 rounded-xl focus:border-primary focus:ring-primary/30 placeholder:text-muted-foreground/70"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {mode === "login" && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 font-semibold h-12 rounded-xl shadow-glow group mt-1"
                      onClick={handleAuth}
                      disabled={loading || sendingOtp}
                    >
                      {loading || sendingOtp ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {mode === "login" ? "Sign In" : "Create Account"}
                          <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground pt-1">
                      {mode === "login" ? "New delegate? " : "Already on the floor? "}
                      <button
                        onClick={() => setMode(mode === "login" ? "signup" : "login")}
                        className="text-primary font-semibold hover:underline"
                      >
                        {mode === "login" ? "Create an account" : "Sign in"}
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>

            <p className="text-center mt-5 text-[11px] text-muted-foreground/70">
              By continuing you agree to our <span className="text-foreground/80 hover:text-primary cursor-pointer">Terms</span> & <span className="text-foreground/80 hover:text-primary cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Auth;
