import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/async";

type AuthContextType = {
  user: User | null;
  roles: Set<string>;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: new Set(),
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (u: User | null) => {
    setLoading(true);
    if (!u) {
      setUser(null);
      setRoles(new Set());
      setLoading(false);
      return;
    }
    try {
      setUser(u);
      const { data: roleRows } = await withTimeout(
        supabase.from("user_roles").select("role").eq("user_id", u.id),
        15000,
        "Authentication data timed out"
      );
      setRoles(new Set((roleRows || []).map((row: any) => row.role)));
    } catch (error) {
      console.error("Failed to fetch auth state", error);
      setRoles(new Set());
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      const { data } = await withTimeout(supabase.auth.getUser(), 15000, "User session timed out");
      await fetchUserData(data.user);
    } catch (error) {
      console.error("Failed to refresh auth state", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void fetchUserData(session?.user ?? null);
    });

    void supabase.auth
      .getSession()
      .then(({ data }) => fetchUserData(data.session?.user ?? null))
      .catch((error) => {
        console.error("Failed to get session", error);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles(new Set());
  };

  return <AuthContext.Provider value={{ user, roles, loading, signOut, refresh }}>{children}</AuthContext.Provider>;
};
