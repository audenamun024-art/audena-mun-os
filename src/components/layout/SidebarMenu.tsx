import { Link } from "react-router-dom";
import { X, Home, Calendar, Video, Trophy, User, Shield, Settings, LogIn } from "lucide-react";

const menuItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/buzz", label: "Buzz", icon: Video },
  { path: "/rankboard", label: "Rankboard", icon: Trophy },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/admin", label: "Admin Dashboard", icon: Shield },
  { path: "/organizer", label: "Organizer Dashboard", icon: Settings },
  { path: "/auth", label: "Sign In", icon: LogIn },
];

const SidebarMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-navy-dark/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed left-0 top-0 bottom-0 z-[95] w-72 bg-sidebar border-r border-sidebar-border animate-fade-in flex flex-col">
        <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border">
          <span className="font-serif text-lg font-bold text-sidebar-primary">AudenaMUN</span>
          <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <item.icon className="h-4.5 w-4.5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40 text-center">AudenaMUN v1.0</p>
        </div>
      </aside>
    </>
  );
};

export default SidebarMenu;
