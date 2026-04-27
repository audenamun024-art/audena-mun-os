import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Mail, Loader2, User, Lock, AtSign } from "lucide-react";
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[hsl(222_47%_4%)]">
      {/* Premium blue glow backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/25 rounded-full blur-[140px] animate-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-block rounded-3xl overflow-hidden bg-white shadow-elevated ring-1 ring-primary/30 mb-4">
            <img src={audenaLogo} alt="Audena Hub" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
            Welcome to <span className="text-gradient-primary">Audena Hub</span>
          </h1>
          <p className="text-[11px] text-muted-foreground tracking-[0.3em] uppercase font-medium mt-1.5">
            Connect · Discuss · Grow
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-elevated border-primary/20">
          {otpStep ? (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3 ring-1 ring-primary/40">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Verify your email</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  6-digit code sent to <span className="font-medium text-primary">{email}</span>
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
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold h-11 rounded-xl shadow-glow"
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
              {/* Tab toggle */}
              <div className="flex bg-secondary/70 rounded-2xl p-1 mb-6 border border-border">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      mode === m
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>

              <div className="space-y-4 animate-fade-in">
                {mode === "signup" && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Full name</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="bg-secondary/60 border-border h-11 pl-10 rounded-xl focus:border-primary focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                  <div className="relative mt-1.5">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-secondary/60 border-border h-11 pl-10 rounded-xl focus:border-primary focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-secondary/60 border-border h-11 pl-10 pr-10 rounded-xl focus:border-primary focus:ring-primary/30"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold h-11 rounded-xl shadow-glow group mt-2"
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

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-muted-foreground hover:text-primary w-full text-center block transition-colors"
                  >
                    Forgot password?
                  </button>
                )}

                <p className="text-center text-xs text-muted-foreground pt-1">
                  {mode === "login" ? "New to Audena Hub? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-primary font-semibold hover:underline"
                  >
                    {mode === "login" ? "Create one" : "Sign in"}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-5 text-[11px] text-muted-foreground/60">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
