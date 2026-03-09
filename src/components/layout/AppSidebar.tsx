import { Home, Calendar, Play, Trophy, User, MessageCircle, Shield, Gavel, AlertTriangle, Building2, LogIn, PlusCircle, LogOut, Sun, Moon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, roles, accountType, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const isOrganizer = roles.has("organizer") || accountType === "organisation";
  const isEB = roles.has("eb");
  const isAdmin = roles.has("admin");
  const isDelegateOnly = !isOrganizer && !isEB && !isAdmin;

  const mainItems = [
    { title: "Home", url: "/", icon: Home },
    { title: "Events", url: "/events", icon: Calendar },
    { title: "Buzz Feed", url: "/buzz", icon: Play },
    { title: "Chats", url: "/chats", icon: MessageCircle },
    { title: "Profile", url: "/profile", icon: User },
    ...(isDelegateOnly ? [
      { title: "Rankings", url: "/rankboard", icon: Trophy },
    ] : []),
  ];

  const organizerItems = isOrganizer ? [
    { title: "Organisation Profile", url: "/organizer", icon: Building2 },
  ] : [];

  const managementItems = [
    ...(isEB ? [{ title: "Crisis Mode", url: "/crisis", icon: AlertTriangle }] : []),
    ...(isAdmin ? [{ title: "Admin Panel", url: "/admin", icon: Shield }] : []),
    ...((isEB || isAdmin) ? [
      { title: "Rankings", url: "/rankboard", icon: Trophy },
    ] : []),
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
          activeClassName="bg-primary/10 text-primary font-semibold"
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
              Audena<span className="text-primary">Hub</span>
            </span>
          ) : (
            <span className="text-lg font-display font-bold text-primary">A</span>
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

        {organizerItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Organizer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{organizerItems.map(renderNavItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {managementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{managementItems.map(renderNavItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!user && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItem({ title: "Sign In", url: "/auth", icon: LogIn })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && !isOrganizer && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderNavItem({ title: "Become Organizer", url: "/organizer/register", icon: Building2 })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground rounded-xl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span className="text-[13px]">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </Button>
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
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground/40 text-center pt-2">Audena Hub v2.0</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
