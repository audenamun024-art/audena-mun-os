import { useState, useEffect } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type SearchResult = { title: string; subtitle: string; link?: string; category: string };

const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      const [{ data: events }, { data: delegates }, { data: orgs }] = await Promise.all([
        supabase.from("events").select("id, title, location, start_date").ilike("title", `%${query}%`).limit(5),
        supabase.from("profiles").select("user_id, full_name, institution, rank_points").ilike("full_name", `%${query}%`).limit(5),
        supabase.from("organizers").select("id, name, contact_email").ilike("name", `%${query}%`).limit(5),
      ]);

      const all: SearchResult[] = [
        ...(events || []).map((e: any) => ({ title: e.title, subtitle: `${e.location || ""} · ${e.start_date || ""}`, link: `/events/${e.id}`, category: "Events" })),
        ...(delegates || []).map((p: any) => ({ title: p.full_name || "Unknown", subtitle: `${p.institution || ""} · ${p.rank_points || 0} pts`, link: `/profile/${p.user_id}`, category: "Delegates" })),
        ...(orgs || []).map((o: any) => ({ title: o.name, subtitle: o.contact_email || "", link: `/events`, category: "Institutions" })),
      ];
      setResults(all);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  const handleResultClick = (result: SearchResult) => {
    if (result.link) { onClose(); navigate(result.link); }
  };

  if (!open) return null;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

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

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
        {!query && <p className="text-center text-muted-foreground py-12 text-sm">Start typing to search...</p>}
        {query && loading && <p className="text-center text-muted-foreground py-12 text-sm">Searching...</p>}
        {query && !loading && results.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No results found</p>}
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-2">{category}</p>
            <div className="space-y-1">
              {items.map((result, i) => (
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
        ))}
      </div>
    </div>
  );
};

export default SearchModal;
