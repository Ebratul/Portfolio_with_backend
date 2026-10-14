"use client";

import type { AriaAttributes, ComponentType } from "react";
import * as Si from "react-icons/si";
import { IconGridPicker } from "./IconGridPicker";

type Icon = ComponentType<{ className?: string; style?: { color?: string }; "aria-hidden"?: AriaAttributes["aria-hidden"] }>;
const all = Si as unknown as Record<string, Icon>;

export function SiPreview({ name, color, className }: { name: string; color?: string | null | undefined; className?: string }) {
  const Icon = all[name];
  return Icon ? <Icon aria-hidden className={className} {...(color ? { style: { color } } : {})} /> : <span className={className} />;
}

export function SiPicker(props: { open: boolean; onOpenChange: (o: boolean) => void; value: string; onPick: (name: string) => void }) {
  return <IconGridPicker title="Choose a technology icon" icons={all} {...props} />;
}
