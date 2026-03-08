import { Link } from "react-router-dom";
import { Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import SearchModal from "./SearchModal";
import AppSidebar from "./AppSidebar";
import NotificationDropdown from "./NotificationDropdown";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

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
                <Link to="/" className="text-base font-extrabold tracking-tight md:hidden">
                  <span className="text-foreground">Audena</span><span className="text-primary">Hub</span>
                </Link>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-[18px] w-[18px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </Button>
                <NotificationDropdown />
                {user ? (
                  <Link to="/profile">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border hover:border-foreground/20 transition-colors">
                      <span className="text-foreground text-[11px] font-bold">{initials}</span>
                    </div>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="text-xs h-8 border-border font-medium">
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
