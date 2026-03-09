import AppLayout from "@/components/layout/AppLayout";
import { MessageCircle, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Chats = () => {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Chats</h1>
            <p className="text-xs text-muted-foreground">Message delegates & organizers</p>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-20">
            <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Sign in to start chatting</p>
            <Link to="/auth">
              <Button className="bg-gradient-primary text-primary-foreground">Sign In</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-10 bg-card border-border h-11 rounded-xl"
              />
            </div>

            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Start chatting with delegates and organizers from your MUN events.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Chats;
