import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type ConnectionStatus = "none" | "pending" | "connected" | "received";

export const useConnections = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [networkCount, setNetworkCount] = useState(0);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("connections" as any)
      .select("*")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);
    const rows = (data as any[]) || [];
    setConnections(rows);
    setNetworkCount(rows.filter((c: any) => c.status === "connected").length);
  }, [user]);

  useEffect(() => {
    fetchConnections();
    if (!user) return;
    const channel = supabase
      .channel("connections-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => {
        fetchConnections();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConnections]);

  const getStatus = useCallback(
    (targetUserId: string): ConnectionStatus => {
      if (!user) return "none";
      const conn = connections.find(
        (c: any) =>
          (c.requester_id === user.id && c.receiver_id === targetUserId) ||
          (c.receiver_id === user.id && c.requester_id === targetUserId)
      );
      if (!conn) return "none";
      if (conn.status === "connected") return "connected";
      if (conn.requester_id === user.id) return "pending";
      return "received";
    },
    [user, connections]
  );

  const connect = useCallback(
    async (targetUserId: string) => {
      if (!user) return;
      await (supabase.from("connections" as any) as any).insert({
        requester_id: user.id,
        receiver_id: targetUserId,
        status: "pending",
      });
      // Send notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const name = (profile as any)?.full_name || "Someone";
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: `${name} wants to connect`,
        message: `${name} sent you a connection request.`,
        link: `/profile/${user.id}`,
      });
      fetchConnections();
    },
    [user, fetchConnections]
  );

  const acceptConnection = useCallback(
    async (targetUserId: string) => {
      if (!user) return;
      await (supabase.from("connections" as any) as any)
        .update({ status: "connected" })
        .or(`and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId})`);
      // Notify the requester
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const name = (profile as any)?.full_name || "Someone";
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        title: `${name} connected with you`,
        message: `${name} accepted your connection request.`,
        link: `/profile/${user.id}`,
      });
      fetchConnections();
    },
    [user, fetchConnections]
  );

  const removeConnection = useCallback(
    async (targetUserId: string) => {
      if (!user) return;
      await (supabase.from("connections" as any) as any)
        .delete()
        .or(`and(requester_id.eq.${targetUserId},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${targetUserId})`);
      fetchConnections();
    },
    [user, fetchConnections]
  );

  return { connections, networkCount, getStatus, connect, acceptConnection, removeConnection, refresh: fetchConnections };
};
