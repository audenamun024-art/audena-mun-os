import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
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
  { code: "UNW", name: "United Nations Entity for Gender Equality and the Empowerment of Women" },
  { code: "UNFCCC", name: "United Nations Framework Convention on Climate Change" },
  { code: "UNHRC", name: "United Nations Human Rights Council" },
  { code: "GMGF", name: "Global Monetary and Governance Forum" },
  { code: "UNGA-SPECOL", name: "United Nations General Assembly – Special Political and Decolonization Committee" },
];

type Props = {
  value?: string[];
  onChange?: (codes: string[]) => void;
  options?: CommitteeOption[];
  multi?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  dropdownClassName?: string;
};

const CommitteeDropdown = ({
  value = [],
  onChange,
  options = DEFAULT_COMMITTEES,
  multi = false,
  label = "All Committees",
  placeholder = "Search committee…",
  className,
  dropdownClassName,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      `${option.code} ${option.name}`.toLowerCase().includes(q)
    );
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const headerLabel = (() => {
    if (!value.length) return label;
    if (multi) return `${value.length} committee${value.length > 1 ? "s" : ""} selected`;
    const found = options.find((option) => option.code === value[0]);
    return found ? `${found.code} – ${found.name}` : value[0];
  })();

  const toggle = (code: string) => {
    if (multi) {
      onChange?.(selectedSet.has(code) ? value.filter((item) => item !== code) : [...value, code]);
      return;
    }
    onChange?.([code]);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "group flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-card transition-all duration-200",
          "hover:border-primary/40 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          open && "border-primary/50 shadow-glow"
        )}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className={cn("block truncate text-sm font-semibold", value.length ? "text-foreground" : "text-muted-foreground")}>
            {headerLabel}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-primary",
            open && "rotate-180 text-primary"
          )}
        />
      </button>

      <div
        className={cn(
          "absolute left-0 right-0 z-[120] mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated transition-all duration-200 ease-out",
          open ? "max-h-[380px] translate-y-0 opacity-100" : "max-h-0 -translate-y-1 border-transparent opacity-0 pointer-events-none",
          dropdownClassName
        )}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-popover p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="h-10 w-full rounded-lg border border-border bg-secondary/70 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div role="listbox" aria-multiselectable={multi} className="max-h-[300px] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No committees found</p>
          ) : (
            filtered.map((option) => {
              const selected = selectedSet.has(option.code);
              return (
                <button
                  key={option.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => toggle(option.code)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    selected && "bg-primary/10 ring-1 ring-inset ring-primary/30"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">{option.code}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">{option.name}</span>
                  </span>
                  <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border", selected && "border-primary bg-primary text-primary-foreground")}>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
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
