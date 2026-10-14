"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState, type AriaAttributes, type ComponentType } from "react";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

const LIMIT = 120;

/** Searchable icon grid. Shows at most LIMIT matches so thousands of icons stay snappy. */
export function IconGridPicker({
  title,
  icons,
  open,
  onOpenChange,
  value,
  onPick,
}: {
  title: string;
  icons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: AriaAttributes["aria-hidden"] }>>;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: string;
  onPick: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const names = useMemo(() => Object.keys(icons).filter((n) => /^[A-Z]/.test(n)), [icons]);
  const matches = useMemo(
    () => (deferred ? names.filter((n) => n.toLowerCase().includes(deferred)) : names),
    [names, deferred],
  );

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={`${matches.length.toLocaleString()} icons${matches.length > LIMIT ? ` — showing the first ${LIMIT}` : ""}`} size="lg">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <Input
          autoFocus
          aria-label="Search icons"
          placeholder="Search, e.g. react, github, rocket…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className="pl-9"
        />
      </div>
      {matches.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No icons match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {matches.slice(0, LIMIT).map((name) => {
            const Icon = icons[name];
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(name);
                    onOpenChange(false);
                  }}
                  aria-label={name}
                  aria-pressed={name === value}
                  title={name}
                  className={cn(
                    "flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-line p-1 transition hover:border-primary",
                    name === value && "border-primary bg-primary/10",
                  )}
                >
                  {Icon ? <Icon aria-hidden className="size-6" /> : null}
                  <span className="w-full truncate text-center text-[10px] text-muted">{name.replace(/^Si/, "")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
