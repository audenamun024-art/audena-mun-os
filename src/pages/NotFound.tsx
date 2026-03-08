import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-display font-bold text-primary mb-2">404</h1>
        <p className="text-lg font-semibold text-foreground mb-1">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page <code className="text-xs bg-secondary px-1.5 py-0.5 rounded-md">{location.pathname}</code> doesn't exist.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="bg-gradient-primary text-primary-foreground gap-2">
              <Home className="h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
