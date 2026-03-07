import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, Home, Calendar, Play, Trophy, User, Shield, Gavel, LogIn, AlertTriangle, Building2, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type MenuItem = { path: string; label: string; icon: any };

const SidebarMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string>("personal");
  const [roles, setRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const fetchAccess = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user;
      setUserId(currentUser?.id ?? null);
      if (!currentUser) { setRoles(new Set()); setAccountType("personal"); return; }
      const [{ data: roleRows }, { data: profileRow }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", currentUser.id),
        supabase.from("profiles").select("account_type").eq("user_id", currentUser.id).maybeSingle(),
      ]);
      setRoles(new Set((roleRows || []).map((row: any) => row.role)));
      setAccountType((profileRow as any)?.account_type || "personal");
    };
    fetchAccess();
  }, [open]);

  const menuItems = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { path: "/", label: "Home", icon: Home },
      { path: "/events", label: "Events", icon: Calendar },
      { path: "/buzz", label: "Buzz", icon: Play },
      { path: "/rankboard", label: "Rankboard", icon: Trophy },
      { path: "/research", label: "Research Browser", icon: Globe },
      { path: "/profile", label: "Profile", icon: User },
    ];
    if (roles.has("eb")) items.push({ path: "/crisis", label: "Crisis Mode", icon: AlertTriangle });
    if (roles.has("admin")) items.push({ path: "/admin", label: "Admin Dashboard", icon: Shield });
    if (roles.has("organizer") || accountType === "organisation") items.push({ path: "/organizer", label: "Organizer Dashboard", icon: Gavel });
    if (userId && !roles.has("organizer") && accountType !== "organisation") items.push({ path: "/organizer/register", label: "Become an Organizer", icon: Building2 });
    if (!userId) items.push({ path: "/auth", label: "Sign In", icon: LogIn });
    return items;
  }, [accountType, roles, userId]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed left-0 top-0 bottom-0 z-[95] w-72 bg-card border-r border-border animate-slide-in-left flex flex-col shadow-elevated">
        <div className="flex items-center justify-between px-5 h-14 border-b border-border">
          <span className="text-lg font-extrabold"><span className="text-gradient-primary">AudenaMUN</span></span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/70 hover:bg-secondary hover:text-foreground transition-all">
              <item.icon className="h-[18px] w-[18px]" /><span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border"><p className="text-[10px] text-muted-foreground text-center">AudenaMUN v2.0</p></div>
      </aside>
    </>
  );
};

export default SidebarMenu;
