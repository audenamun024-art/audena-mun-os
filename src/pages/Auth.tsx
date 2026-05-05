import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Mail, Loader2, User, Lock, AtSign } from "lucide-react";
import audenaLogo from "@/assets/audena-logo.jpg";

type Mode = "login" | "signup";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const callFn = async (path: string, body: unknown) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const sendOtp = async () => {
    if (!email || !password || !fullName) { toast.error("Fill in all fields first"); return; }
    setSendingOtp(true);
    try {
      await callFn("send-otp", { email });
      setOtpStep(true);
      toast.success("Verification code sent");
    } catch (err: any) {
      toast.error(err.message || "Could not send code");
    } finally { setSendingOtp(false); }
  };

  const verifyOtpAndSignup = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      await callFn("verify-otp", { email, otp, password, full_name: fullName });
      // Auto sign-in now that the account exists & is confirmed
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw signInErr;
      toast.success("Welcome to Audena Hub");
      await refresh();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally { setLoading(false); }
  };

  const handleAuth = async () => {
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    if (mode === "signup") {
      if (!fullName) { toast.error("Enter your name"); return; }
      await sendOtp();
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back");
      await refresh();
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent");
  };

  return (
    <div className="min-h-screen w-full bg-[#08090c] text-foreground relative overflow-hidden flex flex-col">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <main className="relative z-10 flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Big logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.6)] ring-1 ring-white/10">
              <img src={audenaLogo} alt="Audena Hub" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-2xl shadow-2xl p-7 sm:p-8">
            {otpStep ? (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3 ring-1 ring-primary/30">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-semibold text-foreground">Verify your email</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 font-semibold h-12 rounded-xl"
                  onClick={verifyOtpAndSignup}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Continue"}
                </Button>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setOtpStep(false); setOtp(""); }} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
                  <button onClick={sendOtp} disabled={sendingOtp} className="text-xs text-primary hover:underline font-medium disabled:opacity-50">
                    {sendingOtp ? "Sending..." : "Resend code"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-[22px] font-display font-semibold text-foreground tracking-tight">
                    {mode === "login" ? "Sign in" : "Create your account"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mode === "login" ? "Welcome back to your hub." : "Join the global MUN community."}
                  </p>
                </div>

                {mode === "signup" && (
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full name"
                      className="bg-white/[0.03] border-white/10 h-12 pl-10 rounded-xl"
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
                    className="bg-white/[0.03] border-white/10 h-12 pl-10 rounded-xl"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-white/[0.03] border-white/10 h-12 pl-10 pr-10 rounded-xl"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {mode === "login" && (
                  <div className="flex justify-end -mt-1">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-[11px] text-muted-foreground hover:text-foreground">
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  onClick={handleAuth}
                  disabled={loading || sendingOtp}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95 font-semibold h-12 rounded-xl group"
                >
                  {loading || sendingOtp ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign in" : "Create account"}
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>

                <div className="pt-3 border-t border-white/5 text-center">
                  <p className="text-xs text-muted-foreground">
                    {mode === "login" ? "New user? " : "Already have an account? "}
                    <button
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="text-primary font-semibold hover:underline"
                    >
                      {mode === "login" ? "Create an account" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-center mt-5 text-[11px] text-muted-foreground/70">
            By continuing you agree to our{" "}
            <span className="text-foreground/80 hover:text-primary cursor-pointer">Terms</span> &{" "}
            <span className="text-foreground/80 hover:text-primary cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
