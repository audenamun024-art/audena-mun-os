import { Home, Calendar, Play, Globe, Search } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import SearchModal from "./SearchModal";

const tabs = [
  { label: "Home", path: "/", icon: Home, end: true },
  { label: "Events", path: "/events", icon: Calendar },
  { label: "Buzz", path: "/buzz", icon: Play },
  { label: "Research", path: "/research", icon: Globe },
];

const BottomNav = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border md:hidden">
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
          <button
            onClick={() => setSearchOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>
        </div>
      </nav>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default BottomNav;
