import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const RequireAuth = ({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !roles.has("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The admin page is working, but this account does not have admin permission.
          </p>
          <div className="mt-5 flex gap-2">
            <Button asChild variant="outline" className="flex-1 rounded-xl">
              <Link to="/">Back</Link>
            </Button>
            <Button asChild className="flex-1 rounded-xl bg-primary text-primary-foreground">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
