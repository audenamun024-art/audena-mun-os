import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitteeOption = { code: string; name: string };

export const DEFAULT_COMMITTEES: CommitteeOption[] = [
  { code: "WHA", name: "World Health Assembly" },
  { code: "ECOSOC", name: "Economic and Social Council" },
  { code: "JCC-IWC", name: "Joint Crisis Committee – International War Crisis" },
  { code: "JCC-PWC", name: "Joint Crisis Committee – Political War Crisis" },
  { code: "AIPPM", name: "All India Political Parties Meet" },
  { code: "UNDP", name: "United Nations Development Programme" },
  { code: "UNESCO", name: "United Nations Educational, Scientific and Cultural Organization" },
  { code: "UNSC", name: "United Nations Security Council" },
  { code: "NATO", name: "North Atlantic Treaty Organization" },
  { code: "IP-Journalist", name: "International Press – Journalist" },
  { code: "IP-Photojournalist", name: "International Press – Photojournalist" },
  { code: "UNW", name: "UN Women" },
  { code: "UNFCCC", name: "United Nations Framework Convention on Climate Change" },
  { code: "UNHRC", name: "United Nations Human Rights Council" },
  { code: "GMGF", name: "Global Monetary & Governance Forum" },
  { code: "UNGA-SPECOL", name: "Special Political & Decolonization Committee" },
];

type Props = {
  value?: string[];
  onChange?: (codes: string[]) => void;
  options?: CommitteeOption[];
  multi?: boolean;
  label?: string;
  className?: string;
};

const CommitteeDropdown = ({
  value = [],
  onChange,
  options = DEFAULT_COMMITTEES,
  multi = false,
  label = "All Committees",
  className,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
    );
  }, [options, query]);

  const selectedSet = new Set(value);
  const headerLabel = (() => {
    if (value.length === 0) return label;
    if (multi) return `${value.length} Committees Selected`;
    const found = options.find((o) => o.code === value[0]);
    return found ? `${found.code} – ${found.name}` : value[0];
  })();

  const toggle = (code: string) => {
    if (multi) {
      const next = selectedSet.has(code)
        ? value.filter((c) => c !== code)
        : [...value, code];
      onChange?.(next);
    } else {
      onChange?.([code]);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors text-left"
      >
        <span className={cn("text-sm font-medium truncate", value.length ? "text-foreground" : "text-muted-foreground")}>
          {headerLabel}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-popover shadow-elevated transition-all duration-200 ease-in-out absolute z-50 left-0 right-0 mt-2",
          open ? "max-h-[340px] opacity-100" : "max-h-0 opacity-0 border-transparent"
        )}
      >
        <div className="p-2 border-b border-border bg-card sticky top-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search committee…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>
        <div className="max-h-[260px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No committees found</p>
          ) : (
            filtered.map((o) => {
              const selected = selectedSet.has(o.code);
              return (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => toggle(o.code)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors",
                    selected && "bg-accent/10 ring-1 ring-inset ring-accent/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{o.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{o.name}</p>
                  </div>
                  {selected && <Check className="h-4 w-4 text-accent shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitteeDropdown;
