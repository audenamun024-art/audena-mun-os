import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
    if (!u) {
      setUser(null);
      setRoles(new Set());
      setAccountType("personal");
      setLoading(false);
      return;
    }
    setUser(u);
    const [{ data: roleRows }, { data: profileRow }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", u.id),
      supabase.from("profiles").select("account_type").eq("user_id", u.id).maybeSingle(),
    ]);
    setRoles(new Set((roleRows || []).map((r: any) => r.role)));
    setAccountType((profileRow as any)?.account_type || "personal");
    setLoading(false);
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    await fetchUserData(data.user);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await fetchUserData(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      fetchUserData(data.session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles(new Set());
    setAccountType("personal");
  };

  return (
    <AuthContext.Provider value={{ user, roles, accountType, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};
