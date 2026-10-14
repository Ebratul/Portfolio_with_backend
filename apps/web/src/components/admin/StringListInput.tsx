"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

/** Repeatable text fields (paragraphs, feature bullets). */
export function StringListInput({
  idPrefix,
  value,
  onChange,
  multiline,
  addLabel,
  placeholder,
}: {
  idPrefix: string;
  value: string[];
  onChange: (next: string[]) => void;
  multiline?: boolean;
  addLabel: string;
  placeholder?: string;
}) {
  const set = (i: number, text: string): void => {
    onChange(value.map((v, idx) => (idx === i ? text : v)));
  };

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {multiline ? (
            <Textarea
              id={`${idPrefix}-${i}`}
              aria-label={`${addLabel} ${i + 1}`}
              value={item}
              rows={3}
              placeholder={placeholder}
              onChange={(e) => {
                set(i, e.target.value);
              }}
            />
          ) : (
            <Input
              id={`${idPrefix}-${i}`}
              aria-label={`${addLabel} ${i + 1}`}
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                set(i, e.target.value);
              }}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove item ${i + 1}`}
            onClick={() => {
              onChange(value.filter((_, idx) => idx !== i));
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          onChange([...value, ""]);
        }}
      >
        <Plus className="size-4" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}
