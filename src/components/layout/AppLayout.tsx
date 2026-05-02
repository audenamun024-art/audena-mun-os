import { Link, useLocation, useNavigate } from "react-router-dom";
import { Compass, Plus, Search, Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import NotificationDropdown from "./NotificationDropdown";
import BottomNav from "./BottomNav";
import BuzzUploadModal from "@/components/buzz/BuzzUploadModal";
import PostUploadModal from "@/components/posts/PostUploadModal";
import EventCreateModal from "@/components/events/EventCreateModal";
import CreateMenu from "@/components/create/CreateMenu";

// Wraps children in a swipe-from-left-edge gesture (mobile only) that opens the sidebar.
const SwipeArea = ({ children }: { children: React.ReactNode }) => {
  const { setOpenMobile } = useSidebar();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t.clientX > 30) return; // only edge swipes
    startX.current = t.clientX;
    startY.current = t.clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = Math.abs(t.clientY - startY.current);
    if (dx > 60 && dy < 40) {
      setOpenMobile(true);
      startX.current = null;
    }
  };
  const onTouchEnd = () => { startX.current = null; startY.current = null; };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="contents">
      {children}
    </div>
  );
};

const AppLayoutInner = ({ children }: { children: React.ReactNode }) => {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [buzzOpen, setBuzzOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const isHomePage = location.pathname === "/";

  // close menu listener
  useEffect(() => { setCreateMenuOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <SwipeArea>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 glass-panel border-b border-border">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-1">
                {/* Desktop sidebar trigger */}
                {!isHomePage && (
                  <SidebarTrigger className="hidden md:inline-flex text-foreground hover:bg-secondary" />
                )}
                {/* Mobile: search opens explore (was sidebar trigger) */}
                <Button
                  variant="ghost" size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-secondary h-9 w-9 md:hidden"
                  onClick={() => navigate("/explore")}
                  aria-label="Search"
                >
                  <Search className="h-[18px] w-[18px]" />
                </Button>
                {/* Desktop: explore icon */}
                <Button
                  variant="ghost" size="icon"
                  className="hidden md:inline-flex text-muted-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                  onClick={() => navigate("/explore")}
                >
                  <Compass className="h-[18px] w-[18px]" />
                </Button>
              </div>

              <Link
                to="/"
                className="absolute left-1/2 -translate-x-1/2 select-none"
              >
                <span className="text-[22px] font-display font-bold tracking-tight text-foreground leading-none">
                  AudenaHub
                </span>
              </Link>

              <div className="flex items-center gap-1">
                {user && (
                  <Button
                    variant="ghost" size="icon"
                    className="text-muted-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                    onClick={() => setCreateMenuOpen(true)}
                    aria-label="Create"
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
      </SwipeArea>

      <BottomNav />

      {user && (
        <>
          <CreateMenu
            open={createMenuOpen}
            onClose={() => setCreateMenuOpen(false)}
            onChoose={(c) => {
              if (c === "buzz") setBuzzOpen(true);
              else if (c === "drops") setPostOpen(true);
              else if (c === "event") setEventOpen(true);
            }}
          />
          <BuzzUploadModal
            open={buzzOpen}
            onClose={() => setBuzzOpen(false)}
            onUploaded={() => { setBuzzOpen(false); window.location.reload(); }}
            userId={user.id}
          />
          <PostUploadModal
            open={postOpen}
            onClose={() => setPostOpen(false)}
            onUploaded={() => { setPostOpen(false); }}
            userId={user.id}
          />
          <EventCreateModal
            open={eventOpen}
            onClose={() => setEventOpen(false)}
            onCreated={() => { setEventOpen(false); navigate("/events"); }}
            userId={user.id}
          />
        </>
      )}
    </div>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <AppLayoutInner>{children}</AppLayoutInner>
  </SidebarProvider>
);

export default AppLayout;
