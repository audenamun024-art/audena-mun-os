import { Link } from "react-router-dom";
import { X, Home, Calendar, Play, Trophy, User, Shield, Gavel, LogIn, AlertTriangle, Building2, Globe, Award } from "lucide-react";

const menuItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/buzz", label: "Buzz", icon: Play },
  { path: "/rankboard", label: "Rankboard", icon: Trophy },
  { path: "/crisis", label: "Crisis Mode", icon: AlertTriangle },
  { path: "/research", label: "Research Browser", icon: Globe },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/admin", label: "Admin Dashboard", icon: Shield },
  { path: "/organizer", label: "Organizer Dashboard", icon: Gavel },
  { path: "/organizer/register", label: "Become an Organizer", icon: Building2 },
  { path: "/auth", label: "Sign In", icon: LogIn },
];

const SidebarMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed left-0 top-0 bottom-0 z-[95] w-72 bg-background border-r border-border animate-fade-in flex flex-col">
        <div className="flex items-center justify-between px-5 h-12 border-b border-border">
          <span className="font-serif text-lg font-bold text-gradient-gold">AudenaMUN</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-foreground/70 hover:bg-secondary hover:text-foreground transition-colors"
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">AudenaMUN v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default SidebarMenu;
