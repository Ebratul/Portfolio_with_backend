"use client";

import { icons, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { IconGridPicker } from "./IconGridPicker";

const all = icons as unknown as Record<string, ComponentType<LucideProps>>;
const ALIAS: Record<string, string> = { Code2: "CodeXml" };

export function LucidePreview({ name, className }: { name: string; className?: string }) {
  const Icon = all[ALIAS[name] ?? name];
  return Icon ? <Icon className={className} aria-hidden="true" /> : <span className={className} />;
}

export function LucidePicker(props: { open: boolean; onOpenChange: (o: boolean) => void; value: string; onPick: (name: string) => void }) {
  return <IconGridPicker title="Choose an icon" icons={all} {...props} />;
}
