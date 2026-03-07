import { Link } from "react-router-dom";
import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SearchModal from "./SearchModal";
import AppSidebar from "./AppSidebar";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AU";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-foreground hover:bg-secondary" />
                <Link to="/" className="text-lg font-extrabold tracking-tight md:hidden">
                  <span className="text-gradient-primary">AudenaMUN</span>
                </Link>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-secondary h-9 w-9"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-secondary h-9 w-9"
                >
                  <Bell className="h-5 w-5" />
                </Button>
                {user ? (
                  <Link to="/profile">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{initials}</span>
                    </div>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="text-xs h-8 border-border">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </SidebarProvider>
  );
};

export default AppLayout;
