import { Link, useLocation } from "react-router-dom";
import { Search, Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SearchModal from "./SearchModal";
import AppSidebar from "./AppSidebar";
import NotificationDropdown from "./NotificationDropdown";
import BottomNav from "./BottomNav";
import BuzzUploadModal from "@/components/buzz/BuzzUploadModal";
import { toast } from "sonner";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                {!isHomePage && (
                  <SidebarTrigger className="text-foreground hover:bg-secondary" />
                )}
                <Button
                  variant="ghost" size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-[18px] w-[18px]" />
                </Button>
              </div>

              <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="text-xl font-display font-bold tracking-tight">
                  <span className="text-foreground">Audena</span><span className="text-primary">Hub</span>
                </span>
              </Link>

              <div className="flex items-center gap-1">
                {user && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-[18px] w-[18px]" />
                  </Button>
                )}
                <Link to="/research">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary h-9 w-9">
                    <Globe className="h-[18px] w-[18px]" />
                  </Button>
                </Link>
                <NotificationDropdown />
                {!user && (
                  <Link to="/auth">
                    <Button size="sm" variant="outline" className="text-xs h-8 border-border font-semibold rounded-lg">Sign In</Button>
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
      {user && (
        <BuzzUploadModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onUploaded={() => { setCreateOpen(false); window.location.reload(); }}
          userId={user.id}
        />
      )}
    </SidebarProvider>
  );
};

export default AppLayout;
