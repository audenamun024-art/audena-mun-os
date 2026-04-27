import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import NotificationDropdown from "./NotificationDropdown";
import BottomNav from "./BottomNav";
import BuzzUploadModal from "@/components/buzz/BuzzUploadModal";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 glass-panel border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                {!isHomePage && (
                  <SidebarTrigger className="text-foreground hover:bg-secondary" />
                )}
                <Button
                  variant="ghost" size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                  onClick={() => navigate("/explore")}
                >
                  <Compass className="h-[18px] w-[18px]" />
                </Button>
              </div>

              <Link
                to="/"
                className="absolute left-1/2 -translate-x-1/2 flex items-baseline gap-[2px] select-none group"
              >
                <span className="text-[22px] font-display font-extrabold tracking-tight text-foreground leading-none">
                  Audena
                </span>
                <span className="text-[22px] font-display font-extrabold tracking-tight leading-none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Hub
                </span>
                <span className="ml-1 mt-[2px] h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              </Link>

              <div className="flex items-center gap-1">
                {user && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-[18px] w-[18px]" />
                  </Button>
                )}
                <NotificationDropdown />
              </div>
            </div>
          </header>

          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <BottomNav />
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
