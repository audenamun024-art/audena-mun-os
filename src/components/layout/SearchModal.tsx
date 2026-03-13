import { useState, useEffect } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const tabs = ["Events", "Delegates", "Institutions"];

type SearchResult = { title: string; subtitle: string; link?: string };

const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Events");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      if (activeTab === "Events") {
        const { data } = await supabase.from("events").select("id, title, location, start_date").ilike("title", `%${query}%`).limit(10);
        setResults((data || []).map((e: any) => ({ title: e.title, subtitle: `${e.location || ""} · ${e.start_date || ""}`, link: `/events/${e.id}` })));
      } else if (activeTab === "Delegates") {
        const { data } = await supabase.from("profiles").select("user_id, full_name, institution, rank_points").ilike("full_name", `%${query}%`).limit(10);
        setResults((data || []).map((p: any) => ({ title: p.full_name || "Unknown", subtitle: `${p.institution || ""} · ${p.rank_points || 0} pts`, link: `/profile/${p.user_id}` })));
      } else {
        const { data } = await supabase.from("organizers").select("id, name, contact_email").ilike("name", `%${query}%`).limit(10);
        setResults((data || []).map((o: any) => ({ title: o.name, subtitle: o.contact_email || "", link: `/events` })));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, open]);

  const handleResultClick = (result: SearchResult) => {
    if (result.link) {
      onClose();
      navigate(result.link);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Input
          autoFocus placeholder="Search events, delegates, institutions..."
          value={query} onChange={(e) => setQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 px-4 py-2 border-b border-border">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === tab ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}>{tab}</button>
        ))}
      </div>

      <div className="p-4 space-y-1">
        {results.length === 0 && query && <p className="text-center text-muted-foreground py-12 text-sm">No results found</p>}
        {results.length === 0 && !query && <p className="text-center text-muted-foreground py-12 text-sm">Start typing to search...</p>}
        {results.map((result, i) => (
          <div
            key={i}
            onClick={() => handleResultClick(result)}
            className="p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
          >
            <p className="font-medium text-sm text-foreground">{result.title}</p>
            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchModal;
