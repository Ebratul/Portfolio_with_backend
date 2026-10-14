"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { fieldClass } from "./input";
import { cn } from "@/lib/cn";

export interface Option {
  value: string;
  label: string;
}

export function Select({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  invalid,
  className,
  ariaLabel,
}: {
  id?: string;
  value: string | undefined;
  onValueChange: (v: string) => void;
  options: readonly Option[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  /** Required when the select has no visible <label htmlFor>. */
  ariaLabel?: string;
}) {
  return (
    <SelectPrimitive.Root {...(value === undefined ? {} : { value })} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={invalid}
        {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
        className={cn(fieldClass, "flex h-10 items-center justify-between gap-2 text-left", className)}
      >
        <SelectPrimitive.Value placeholder={placeholder ?? "Select…"} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-muted" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-[120] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line bg-surface shadow-xl"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-primary/15"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2">
                  <Check className="size-4" aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
