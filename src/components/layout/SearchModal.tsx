import { useState, useEffect } from "react";
import { Search, X, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const tabs = ["Events", "Delegates", "Institutions"];

const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("Events");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ title: string; subtitle: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      if (activeTab === "Events") {
        const { data } = await supabase
          .from("events")
          .select("title, location, start_date")
          .ilike("title", `%${query}%`)
          .limit(10);
        setResults(
          (data || []).map((e) => ({
            title: e.title,
            subtitle: `${e.location || ""} · ${e.start_date || ""}`,
          }))
        );
      } else if (activeTab === "Delegates") {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, institution, rank_points")
          .ilike("full_name", `%${query}%`)
          .limit(10);
        setResults(
          (data || []).map((p) => ({
            title: p.full_name || "Unknown",
            subtitle: `${p.institution || ""} · ${p.rank_points || 0} pts`,
          }))
        );
      } else {
        const { data } = await supabase
          .from("organizers")
          .select("institution_name, location")
          .ilike("institution_name", `%${query}%`)
          .limit(10);
        setResults(
          (data || []).map((o) => ({
            title: o.institution_name,
            subtitle: o.location || "",
          }))
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Input
          autoFocus
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 px-4 py-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-1">
        {results.length === 0 && query && (
          <p className="text-center text-muted-foreground py-12 text-sm">No results found</p>
        )}
        {results.length === 0 && !query && (
          <p className="text-center text-muted-foreground py-12 text-sm">Start typing to search...</p>
        )}
        {results.map((result, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors cursor-pointer"
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
