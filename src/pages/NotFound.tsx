import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-serif font-bold text-gradient-gold">404</h1>
        <p className="mb-6 text-muted-foreground">Page not found</p>
        <Link to="/">
          <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Go Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
