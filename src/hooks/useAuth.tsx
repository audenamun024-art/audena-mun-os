import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { withTimeout } from "@/lib/async";

type AuthContextType = {
  user: User | null;
  roles: Set<string>;
  accountType: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: new Set(),
  accountType: "personal",
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [accountType, setAccountType] = useState("personal");
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (u: User | null) => {
    setLoading(true);

    if (!u) {
      setUser(null);
      setRoles(new Set());
      setAccountType("personal");
      setLoading(false);
      return;
    }

    try {
      setUser(u);

      const [{ data: roleRows }, { data: profileRow }] = await withTimeout(
        Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", u.id),
          supabase.from("profiles").select("account_type").eq("user_id", u.id).maybeSingle(),
        ]),
        15000,
        "Authentication data timed out"
      );

      setRoles(new Set((roleRows || []).map((row: any) => row.role)));
      setAccountType((profileRow as any)?.account_type || "personal");
    } catch (error) {
      console.error("Failed to fetch auth state", error);
      setRoles(new Set());
      setAccountType("personal");
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
    setAccountType("personal");
  };

  return <AuthContext.Provider value={{ user, roles, accountType, loading, signOut, refresh }}>{children}</AuthContext.Provider>;
};
