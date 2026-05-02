import { useAuth } from "@/hooks/useAuth";

/**
 * Centralised role detection. Org users get a tailored profile + create menu;
 * delegates (default) keep the original flow.
 */
export const useUserType = () => {
  const { roles, user } = useAuth();
  const isOrganization = roles.has("organization") || user?.user_metadata?.account_type === "organization";
  const isAdmin = roles.has("admin");
  return { isOrganization, isAdmin, isDelegate: !isOrganization };
};
