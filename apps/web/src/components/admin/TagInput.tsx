"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { fieldClass } from "@/components/ui/input";
import { cn } from "@/lib/cn";

/** Chips input: Enter or comma adds, Backspace on an empty field removes the last chip. */
export function TagInput({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function commit(): void {
    const tag = draft.trim().replace(/,$/, "");
    if (tag && !value.some((v) => v.toLowerCase() === tag.toLowerCase())) onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className={cn(fieldClass, "flex min-h-10 flex-wrap items-center gap-1.5 py-1.5")} aria-invalid={invalid}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary/15 py-0.5 pl-2.5 pr-1 text-xs font-medium text-ink">
          {tag}
          <button
            type="button"
            onClick={() => {
              onChange(value.filter((v) => v !== tag));
            }}
            aria-label={`Remove ${tag}`}
            className="grid size-4 place-items-center rounded-full hover:bg-primary/25"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70"
      />
    </div>
  );
}
