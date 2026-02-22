import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const tabs = ["Events", "Delegates", "Institutions"];

const mockResults: Record<string, { title: string; subtitle: string }[]> = {
  Events: [
    { title: "Delhi MUN 2026", subtitle: "Mar 15–17 · New Delhi" },
    { title: "Mumbai Model UN", subtitle: "Apr 5–7 · Mumbai" },
    { title: "National Youth MUN", subtitle: "May 1–3 · Bangalore" },
  ],
  Delegates: [
    { title: "Arjun Mehta", subtitle: "St. Xavier's College · 340 pts" },
    { title: "Priya Sharma", subtitle: "Lady Shri Ram · 290 pts" },
    { title: "Rohan Kapoor", subtitle: "Hindu College · 270 pts" },
  ],
  Institutions: [
    { title: "St. Xavier's College", subtitle: "Mumbai · 45 delegates" },
    { title: "Lady Shri Ram College", subtitle: "New Delhi · 38 delegates" },
    { title: "Hindu College", subtitle: "New Delhi · 32 delegates" },
  ],
};

const SearchModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState("Events");
  const [query, setQuery] = useState("");

  if (!open) return null;

  const filtered = mockResults[activeTab]?.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-background animate-fade-in">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
        <Search className="h-5 w-5 text-muted-foreground shrink-0" />
        <Input
          autoFocus
          placeholder="Search events, delegates, institutions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 text-base"
        />
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-2 px-4 py-3 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {filtered?.map((result, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-card border border-border hover:shadow-card transition-shadow cursor-pointer"
          >
            <p className="font-medium text-foreground">{result.title}</p>
            <p className="text-sm text-muted-foreground">{result.subtitle}</p>
          </div>
        ))}
        {filtered?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No results found</p>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
