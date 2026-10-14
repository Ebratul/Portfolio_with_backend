"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Native colour picker + hex text input kept in sync. `clearable` allows an empty value. */
export function ColorField({
  id,
  value,
  onChange,
  clearable,
  invalid,
}: {
  id: string;
  value: string | null | undefined;
  onChange: (hex: string | null) => void;
  clearable?: boolean;
  invalid?: boolean;
}) {
  const hex = value ?? "";
  const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Pick a colour"
        value={valid ? hex : "#808080"}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
        }}
        className="size-10 shrink-0 cursor-pointer rounded-lg border border-line bg-bg p-1"
      />
      <Input
        id={id}
        value={hex}
        placeholder="#RRGGBB"
        maxLength={7}
        aria-invalid={invalid}
        onChange={(e) => {
          onChange(e.target.value === "" ? null : e.target.value);
        }}
        className="font-mono uppercase"
      />
      {clearable && hex ? (
        <Button variant="ghost" size="icon" aria-label="Clear colour" onClick={() => { onChange(null); }}>
          <X className="size-4" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
