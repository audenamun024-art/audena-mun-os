import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SearchModal from "./SearchModal";
import AppSidebar from "./AppSidebar";
import NotificationDropdown from "./NotificationDropdown";
import BottomNav from "./BottomNav";

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
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-foreground hover:bg-secondary" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-[18px] w-[18px]" />
                </Button>
              </div>

              {/* Centered branding */}
              <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="text-xl font-display font-bold tracking-tight">
                  <span className="text-foreground">Audena</span><span className="text-primary">Hub</span>
                </span>
              </Link>

              <div className="flex items-center gap-1">
                <NotificationDropdown />
                {user ? (
                  <Link to="/profile">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-background hover:scale-105 transition-transform">
                      <span className="text-primary-foreground text-[11px] font-bold">{initials}</span>
                    </div>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="text-xs h-8 border-border font-semibold rounded-lg">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <BottomNav />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </SidebarProvider>
  );
};

export default AppLayout;
