import { useNavigate } from "react-router-dom";
import { User, Settings, Bell, LogOut, HelpCircle, FileText, Shield, ArrowLeft, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const menuItems = [
  { label: "Profile", icon: User, path: "/profile" },
  { label: "Saved Videos", icon: Bookmark, path: "/saved" },
  { label: "Settings", icon: Settings, path: null },
  { label: "Notifications", icon: Bell, path: null },
  { label: "Help", icon: HelpCircle, path: null },
  { label: "Terms of Service", icon: FileText, path: "/terms" },
  { label: "Privacy", icon: Shield, path: "/terms" },
];

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate(-1)} className="text-foreground hover:bg-secondary p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground ml-3">Menu</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              if (item.path) navigate(item.path);
              else toast.info(`${item.label} coming soon`);
            }}
            className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:border-primary/20 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <item.icon className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </button>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-destructive/20 hover:bg-destructive/5 transition-all mt-4"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <span className="text-sm font-medium text-destructive">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileMenu;
