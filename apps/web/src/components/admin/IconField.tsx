"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// The icon sets are huge; they load only on admin pages that actually show or pick icons.
const SiPreview = dynamic(() => import("./icons/SiSet").then((m) => m.SiPreview), { ssr: false, loading: () => <Skeleton className="size-6" /> });
const SiPicker = dynamic(() => import("./icons/SiSet").then((m) => m.SiPicker), { ssr: false });
const LucidePreview = dynamic(() => import("./icons/LucideSet").then((m) => m.LucidePreview), { ssr: false, loading: () => <Skeleton className="size-6" /> });
const LucidePicker = dynamic(() => import("./icons/LucideSet").then((m) => m.LucidePicker), { ssr: false });

export function IconPreview({ kind, name, color, className = "size-6" }: { kind: "si" | "lucide"; name: string; color?: string | null | undefined; className?: string }) {
  return kind === "si" ? <SiPreview name={name} color={color} className={className} /> : <LucidePreview name={name} className={className} />;
}

/** Shows the current icon and opens a searchable picker. */
export function IconField({
  id,
  kind,
  value,
  color,
  onChange,
}: {
  id: string;
  kind: "si" | "lucide";
  value: string;
  color?: string | null | undefined;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const Picker = kind === "si" ? SiPicker : LucidePicker;
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-line bg-bg">
        {value ? <IconPreview kind={kind} name={value} color={color} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{value || "No icon selected"}</p>
      </div>
      <Button id={id} variant="outline" size="sm" aria-label={value ? `Change icon (current: ${value})` : "Choose icon"} onClick={() => { setOpen(true); }}>
        {value ? "Change" : "Choose icon"}
      </Button>
      {open ? <Picker open={open} onOpenChange={setOpen} value={value} onPick={onChange} /> : null}
    </div>
  );
}
