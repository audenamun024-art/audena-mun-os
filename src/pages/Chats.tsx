import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { MessageCircle, Send, Search, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  otherName: string;
  lastMsg?: string;
  unread?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const Chats = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetchConvos = async () => {
      const { data: convos } = await (supabase.from("conversations" as any) as any).select("*")
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (!convos || convos.length === 0) { setConversations([]); setLoading(false); return; }

      const otherIds = (convos as any[]).map((c: any) => c.participant_one === user.id ? c.participant_two : c.participant_one);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", otherIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name || "User"]));

      // Get last messages
      const convoIds = (convos as any[]).map((c: any) => c.id);
      const { data: lastMsgs } = await (supabase.from("messages" as any) as any).select("conversation_id, content, read, sender_id")
        .in("conversation_id", convoIds).order("created_at", { ascending: false });

      const lastMsgMap = new Map<string, any>();
      const unreadMap = new Map<string, number>();
      (lastMsgs as any[] || []).forEach((m: any) => {
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m);
        if (!m.read && m.sender_id !== user.id) unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
      });

      setConversations((convos as any[]).map((c: any) => ({
        ...c,
        otherName: nameMap.get(c.participant_one === user.id ? c.participant_two : c.participant_one) || "User",
        lastMsg: lastMsgMap.get(c.id)?.content || "",
        unread: unreadMap.get(c.id) || 0,
      })));
      setLoading(false);
    };
    fetchConvos();
  }, [user]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConvo) return;
    const fetchMsgs = async () => {
      const { data } = await (supabase.from("messages" as any) as any).select("*")
        .eq("conversation_id", activeConvo.id).order("created_at", { ascending: true });
      setMessages((data as Message[]) || []);
      // Mark unread as read
      if (user) {
        await (supabase.from("messages" as any) as any).update({ read: true })
          .eq("conversation_id", activeConvo.id).neq("sender_id", user.id).eq("read", false);
      }
    };
    fetchMsgs();

    // Realtime subscription
    const channel = supabase.channel(`msgs-${activeConvo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo.id}` },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new as Message]);
          if (payload.new.sender_id !== user?.id) {
            (supabase.from("messages" as any) as any).update({ read: true }).eq("id", payload.new.id);
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo?.id]);

  // Scroll to bottom
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo || !user) return;
    const content = newMsg.trim();
    setNewMsg("");
    await (supabase.from("messages" as any) as any).insert({ conversation_id: activeConvo.id, sender_id: user.id, content });
    await (supabase.from("conversations" as any) as any).update({ last_message_at: new Date().toISOString() }).eq("id", activeConvo.id);
  };

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("user_id, full_name, institution").ilike("full_name", `%${q}%`).neq("user_id", user?.id || "").limit(10);
    setSearchResults(data || []);
  };

  const startConversation = async (otherUserId: string, otherName: string) => {
    if (!user) return;
    // Check existing
    const existing = conversations.find(c =>
      (c.participant_one === user.id && c.participant_two === otherUserId) ||
      (c.participant_one === otherUserId && c.participant_two === user.id)
    );
    if (existing) { setActiveConvo(existing); setSearch(""); setSearchResults([]); return; }

    const { data, error } = await (supabase.from("conversations" as any) as any).insert({
      participant_one: user.id, participant_two: otherUserId,
    }).select().single();
    if (error) return;
    const convo: Conversation = { ...(data as any), otherName, lastMsg: "", unread: 0 };
    setConversations(prev => [convo, ...prev]);
    setActiveConvo(convo);
    setSearch(""); setSearchResults([]);
  };

  const formatTime = (d: string) => {
    try {
      const date = new Date(d);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    } catch { return ""; }
  };

  if (!user) return (
    <AppLayout>
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Sign in to start chatting</p>
        </div>
      </div>
    </AppLayout>
  );

  // Mobile: show either list or chat
  const showChat = !!activeConvo;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar / Conversation List */}
        <div className={`w-full md:w-80 md:border-r border-border flex flex-col shrink-0 ${showChat ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-bold text-foreground mb-3">Chats</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => searchUsers(e.target.value)} placeholder="Search people..." className="pl-9 bg-secondary border-border h-10 rounded-xl text-sm" />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border-b border-border">
              {searchResults.map(p => (
                <button key={p.user_id} onClick={() => startConversation(p.user_id, p.full_name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{(p.full_name || "U")[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{p.institution || "AudenaHub User"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
                <p className="text-xs text-muted-foreground">Search for people to start chatting</p>
              </div>
            ) : conversations.map(c => (
              <button key={c.id} onClick={() => setActiveConvo(c)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left border-b border-border/50 ${
                  activeConvo?.id === c.id ? "bg-primary/5" : "hover:bg-secondary/50"
                }`}>
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-bold text-muted-foreground">{c.otherName[0].toUpperCase()}</span>
                  </div>
                  {(c.unread || 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate">{c.otherName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{formatTime(c.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMsg || "Start a conversation"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!showChat ? "hidden md:flex" : "flex"}`}>
          {activeConvo ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                <button onClick={() => setActiveConvo(null)} className="md:hidden text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-sm font-bold text-muted-foreground">{activeConvo.otherName[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{activeConvo.otherName}</p>
                  <p className="text-[10px] text-muted-foreground">AudenaHub</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-xs text-muted-foreground">Send a message to start the conversation</p>
                  </div>
                )}
                {messages.map(m => {
                  const isMine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}>
                        <p className="break-words">{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                          <span className={`text-[9px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatTime(m.created_at)}
                          </span>
                          {isMine && (m.read ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" /> : <Check className="h-3 w-3 text-primary-foreground/40" />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border bg-card">
                <div className="flex gap-2">
                  <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..."
                    className="bg-secondary border-border h-11 rounded-xl" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                  <Button onClick={sendMessage} className="bg-gradient-primary text-primary-foreground h-11 w-11 p-0 rounded-xl shrink-0" disabled={!newMsg.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Select a conversation</p>
                <p className="text-xs text-muted-foreground mt-1">Or search for someone to chat with</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Chats;
