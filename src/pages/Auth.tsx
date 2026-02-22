import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState("Delegate");

  const roles = ["Delegate", "Organizer", "EB", "Admin"];

  return (
    <div className="min-h-screen bg-navy-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-gold-light mb-2">AudenaMUN</h1>
          <p className="text-sm text-gold-light/60">India's Premier MUN Platform</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-elevated border border-border">
          <div className="flex bg-muted rounded-lg p-1 mb-6">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label className="text-xs font-medium text-foreground">Full Name</Label>
                <Input placeholder="Arjun Mehta" className="mt-1" />
              </div>
            )}

            <div>
              <Label className="text-xs font-medium text-foreground">Email</Label>
              <Input type="email" placeholder="you@example.com" className="mt-1" />
            </div>

            <div>
              <Label className="text-xs font-medium text-foreground">Password</Label>
              <Input type="password" placeholder="••••••••" className="mt-1" />
            </div>

            {mode === "signup" && (
              <div>
                <Label className="text-xs font-medium text-foreground">Role</Label>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        role === r
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark font-medium">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>

            {mode === "login" && (
              <button className="text-xs text-accent hover:underline w-full text-center block">
                Forgot password?
              </button>
            )}
          </div>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-gold-light/40 hover:text-gold-light/60 transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
