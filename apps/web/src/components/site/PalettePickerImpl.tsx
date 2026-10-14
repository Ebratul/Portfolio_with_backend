"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { onColor } from "@/lib/color";
import { ACCENT_PRESETS } from "@/lib/site";

export default function PalettePickerImpl({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("accent") ?? "null") as { primary?: string } | null;
      setActive(saved?.primary ?? null);
    } catch {
      setActive(null);
    }
  }, []);

  function choose(primary: string, accent: string): void {
    const on = onColor(primary);
    const style = document.documentElement.style;
    style.setProperty("--primary", primary);
    style.setProperty("--accent", accent);
    style.setProperty("--on-primary", on);
    setActive(primary);
    try {
      localStorage.setItem("accent", JSON.stringify({ primary, accent, on }));
    } catch {
      /* storage unavailable (private mode): the choice just won't persist */
    }
  }

  return (
    <Popover.Root defaultOpen={defaultOpen}>
      <Popover.Trigger
        aria-label="Choose accent colour"
        className="grid size-10 place-items-center rounded-full border border-line text-fg transition hover:border-primary hover:text-ink"
      >
        <Palette className="size-5" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={10}
          align="end"
          className="glass z-[70] rounded-2xl p-3 shadow-xl"
        >
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted">Accent</p>
          <div className="flex gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.primary}
                type="button"
                onClick={() => {
                  choose(p.primary, p.accent);
                }}
                aria-label={p.name}
                aria-pressed={active?.toLowerCase() === p.primary.toLowerCase()}
                style={{ backgroundImage: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }}
                className="grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-surface transition hover:scale-110 aria-pressed:ring-2 aria-pressed:ring-fg"
              >
                {active?.toLowerCase() === p.primary.toLowerCase() ? (
                  <Check className="size-4 text-white" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
