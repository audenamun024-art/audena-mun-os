import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Search, X, Home, CalendarDays, Film, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchModal from "./SearchModal";
import SidebarMenu from "./SidebarMenu";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/events", label: "Events", icon: CalendarDays },
    { path: "/buzz", label: "Buzz", icon: Film },
    { path: "/rankboard", label: "Ranks", icon: Trophy },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-secondary h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link to="/" className="font-serif text-lg font-bold text-gradient-gold tracking-wide">
            AudenaMUN
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="text-foreground hover:bg-secondary h-9 w-9"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_6px_hsl(43,55%,54%)]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SidebarMenu open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};

export default AppLayout;
