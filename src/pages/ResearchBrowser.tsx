import { useState, useRef } from "react";
import { ArrowLeft, Globe, Shield, AlertTriangle, ExternalLink, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WHITELISTED_DOMAINS = [
  "wikipedia.org", "un.org", "reuters.com", "bbc.com", "bbc.co.uk",
  "aljazeera.com", "economist.com", "foreignaffairs.com", "icj-cij.org",
  "who.int", "worldbank.org", "imf.org", "amnesty.org", "hrw.org", "cfr.org",
];

const BLOCKED_DOMAINS = [
  "chat.openai.com", "chatgpt.com", "gemini.google.com", "bard.google.com",
  "quillbot.com", "copy.ai", "jasper.ai", "claude.ai", "perplexity.ai",
  "writesonic.com", "grammarly.com",
];

const QUICK_LINKS = [
  { name: "Wikipedia", url: "https://en.wikipedia.org", icon: "📚" },
  { name: "United Nations", url: "https://un.org", icon: "🏛" },
  { name: "Reuters", url: "https://reuters.com", icon: "📰" },
  { name: "BBC News", url: "https://bbc.com/news", icon: "📺" },
  { name: "WHO", url: "https://who.int", icon: "🏥" },
  { name: "World Bank", url: "https://worldbank.org", icon: "🏦" },
  { name: "Amnesty Int'l", url: "https://amnesty.org", icon: "⚖️" },
  { name: "Foreign Affairs", url: "https://foreignaffairs.com", icon: "🌍" },
];

const ResearchBrowser = () => {
  const [url, setUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isDomainAllowed = (inputUrl: string): boolean => {
    try {
      const parsed = new URL(inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`);
      const hostname = parsed.hostname.toLowerCase();
      if (BLOCKED_DOMAINS.some((d) => hostname.includes(d))) return false;
      return WHITELISTED_DOMAINS.some((d) => hostname.includes(d));
    } catch {
      return false;
    }
  };

  const logAction = async (action: string, logUrl: string, isBlocked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("research_logs").insert({
        user_id: user.id,
        action,
        url: logUrl,
        blocked: isBlocked,
      });
    }
  };

  const navigateTo = (targetUrl: string) => {
    const fullUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
    if (!isDomainAllowed(fullUrl)) {
      setBlocked(true);
      setCurrentUrl("");
      setIframeError(false);
      logAction("blocked", fullUrl, true);
      toast.error("This domain is not allowed for research.");
      return;
    }
    setBlocked(false);
    setIframeError(false);
    setCurrentUrl(fullUrl);
    setIsLoading(true);
    logAction("navigate", fullUrl, false);

    // Many sites block iframes; give a timeout to detect failure
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  const openExternal = () => {
    if (currentUrl) window.open(currentUrl, "_blank", "noopener");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) navigateTo(url.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-2 px-3 h-12">
          <Link to="/">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-green-500" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL (whitelisted domains only)"
                className="pl-8 h-8 text-sm bg-secondary border-border"
              />
            </div>
            <Button type="submit" size="sm" className="bg-accent text-accent-foreground h-8 text-xs">
              Go
            </Button>
          </form>
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-secondary/50">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-[10px] text-muted-foreground">Secure Research Mode</span>
          </div>
          {currentUrl && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-accent gap-1" onClick={openExternal}>
              <ExternalLink className="h-3 w-3" /> Open in new tab
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {!currentUrl && !blocked && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Globe className="h-12 w-12 text-accent/40 mb-4" />
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">Research Browser</h2>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Secure browsing for MUN research. Only whitelisted academic and news domains are accessible.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-md">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.name}
                  onClick={() => {
                    setUrl(link.url);
                    navigateTo(link.url);
                  }}
                  className="bg-card rounded-xl border border-border p-3 text-center hover:border-accent/30 transition-colors"
                >
                  <span className="text-xl mb-1 block">{link.icon}</span>
                  <span className="text-xs text-foreground font-medium">{link.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 w-full max-w-md">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">Allowed Domains</h3>
              <div className="flex flex-wrap gap-1">
                {WHITELISTED_DOMAINS.map((d) => (
                  <span key={d} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 w-full max-w-md">
              <h3 className="text-xs font-semibold text-destructive mb-2">Blocked (AI Tools)</h3>
              <div className="flex flex-wrap gap-1">
                {BLOCKED_DOMAINS.map((d) => (
                  <span key={d} className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {blocked && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="font-serif text-lg font-bold text-foreground mb-2">Access Blocked</h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              This domain is not allowed during research sessions. AI tools and unauthorized websites are restricted.
            </p>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => {
                setBlocked(false);
                setUrl("");
              }}
            >
              Go Back
            </Button>
          </div>
        )}

        {currentUrl && !blocked && (
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            )}

            {iframeError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 p-6">
                <Globe className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-serif text-base font-bold text-foreground mb-2">Cannot embed this site</h3>
                <p className="text-sm text-muted-foreground text-center mb-4 max-w-sm">
                  This website blocks embedded viewing. Use the button below to open it in a new tab.
                </p>
                <div className="flex gap-2">
                  <Button onClick={openExternal} className="bg-accent text-accent-foreground">
                    <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border"
                    onClick={() => {
                      setCurrentUrl("");
                      setIframeError(false);
                      setUrl("");
                    }}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="w-full h-full min-h-[calc(100vh-7rem)]"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setIframeError(true);
              }}
              title="Research Browser"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchBrowser;
