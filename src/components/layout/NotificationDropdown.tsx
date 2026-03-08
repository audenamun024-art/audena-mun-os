import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean | null;
  created_at: string | null;
};

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data as Notification[]) || []);
    };

    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!user) {
    return (
      <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary h-9 w-9">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-secondary h-9 w-9 relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-primary hover:underline font-medium">
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{n.title}</p>
                      {n.message && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {n.created_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        )}
                        {n.link && (
                          <Link to={n.link} onClick={(e) => e.stopPropagation()} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
