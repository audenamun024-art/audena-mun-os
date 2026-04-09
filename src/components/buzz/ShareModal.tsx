import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  video: any;
};

const ShareModal = ({ open, onClose, video }: Props) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const shareUrl = `${window.location.origin}/buzz?video=${video?.id}`;

  useEffect(() => {
    if (!open || !user) return;
    const fetchFriends = async () => {
      const { data: connections } = await supabase
        .from("connections")
        .select("requester_id, receiver_id")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (!connections || connections.length === 0) return;

      const friendIds = connections.map((c: any) =>
        c.requester_id === user.id ? c.receiver_id : c.requester_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", friendIds);

      setFriends(profiles || []);
    };
    fetchFriends();
  }, [open, user]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check this out on AudenaHub: ${shareUrl}`)}`, "_blank");
  };

  const handleSendToFriend = async (friendId: string) => {
    if (!user) return;
    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(participant_one.eq.${user.id},participant_two.eq.${friendId}),and(participant_one.eq.${friendId},participant_two.eq.${user.id})`)
      .maybeSingle();

    let convId = existing?.id;
    if (!convId) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ participant_one: user.id, participant_two: friendId })
        .select("id")
        .single();
      convId = newConv?.id;
    }

    if (convId) {
      await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        content: `🎬 Check out this Buzz: ${shareUrl}`,
      });
      toast.success("Sent!");
    }
  };

  const filtered = friends.filter((f) =>
    !search || (f.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Share</DialogTitle>
        </DialogHeader>

        {/* Friends list */}
        {friends.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filtered.map((f) => (
                <button
                  key={f.user_id}
                  onClick={() => handleSendToFriend(f.user_id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(f.full_name || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{f.full_name || "User"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {friends.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No connections yet. Share via link below.</p>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-border">
          <Button variant="outline" className="w-full justify-start gap-3 h-11" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" /> Copy Link
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-11 text-green-500 hover:text-green-400" onClick={handleWhatsApp}>
            <ExternalLink className="h-4 w-4" /> Share on WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
