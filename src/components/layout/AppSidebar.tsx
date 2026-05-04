import { Home, Compass, Calendar, Play, MessageCircle, User, Shield, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.has("admin");

  const mainItems = [
    { title: "Home", url: "/", icon: Home },
    { title: "Drops", url: "/explore", icon: Compass },
    { title: "Network", url: "/chats", icon: MessageCircle },
    { title: "Connect", url: "/events", icon: Calendar },
    { title: "Buzz", url: "/buzz", icon: Play },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const renderNavItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          activeClassName="bg-primary/15 text-primary font-semibold shadow-glow"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="text-[13px]">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          {!collapsed ? (
            <span className="text-lg font-display font-bold tracking-tight text-foreground">
              AudenaHub
            </span>
          ) : (
            <span className="text-lg font-display font-bold text-foreground">A</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderNavItem({ title: "Admin Panel", url: "/admin", icon: Shield })}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 space-y-1">
        {user && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-[13px]">Sign Out</span>}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
