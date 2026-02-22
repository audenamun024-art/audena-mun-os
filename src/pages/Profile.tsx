import AppLayout from "@/components/layout/AppLayout";
import { Trophy, Edit, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const badges = ["🏅 Best Delegate", "⭐ Rising Star", "🎯 Top Speaker", "📚 Research Pro"];

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  const displayProfile = profile || {
    full_name: "Guest User",
    institution: "Sign in to view profile",
    total_muns: 0,
    awards_won: 0,
    rank_points: 0,
  };

  const initials = displayProfile.full_name
    ? displayProfile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "GU";

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="px-5 pt-8 pb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-card border-2 border-accent/30 flex items-center justify-center mx-auto mb-3">
            <span className="text-accent text-2xl font-serif font-bold">{initials}</span>
          </div>
          <h1 className="text-lg font-serif font-bold text-foreground">{displayProfile.full_name}</h1>
          <p className="text-sm text-muted-foreground">{displayProfile.institution}</p>
          <div className="flex justify-center gap-8 mt-4">
            {[
              { label: "MUNs", value: displayProfile.total_muns },
              { label: "Awards", value: displayProfile.awards_won },
              { label: "Points", value: displayProfile.rank_points },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 flex gap-2">
          <Button className="flex-1 bg-accent text-accent-foreground hover:bg-gold-dark" size="sm">
            <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
          </Button>
          <Button variant="outline" className="flex-1 border-border" size="sm">
            <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
          </Button>
        </div>

        {/* Badges */}
        <section className="px-4">
          <h2 className="text-base font-serif font-bold text-foreground mb-2">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            {badges.map((b) => (
              <span key={b} className="bg-accent/10 text-accent text-xs font-medium px-3 py-1.5 rounded-full border border-accent/20">
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* Sign Out */}
        <div className="px-4 pb-6">
          {user ? (
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-gold-dark">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
