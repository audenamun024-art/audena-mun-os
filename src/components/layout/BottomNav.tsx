import { Home, Compass, MessageCircle, Calendar, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const tabs = [
  { label: "Home", path: "/", icon: Home, end: true },
  { label: "Drops", path: "/explore", icon: Compass },
  { label: "Network", path: "/chats", icon: MessageCircle },
  { label: "Connect", path: "/events", icon: Calendar },
  { label: "Profile", path: "/profile", icon: User },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 glass-panel border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
