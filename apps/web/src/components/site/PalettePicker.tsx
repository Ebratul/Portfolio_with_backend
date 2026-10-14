"use client";

import { Palette } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

// Radix Popover is only fetched when the visitor first interacts with the button.
const loadImpl = () => import("./PalettePickerImpl");
const Impl = dynamic(loadImpl, { ssr: false });

const buttonClass =
  "grid size-10 place-items-center rounded-full border border-line text-fg transition hover:border-primary hover:text-ink";

export function PalettePicker() {
  const [activated, setActivated] = useState(false);
  if (activated) return <Impl defaultOpen />;
  return (
    <button
      type="button"
      aria-label="Choose accent colour"
      className={buttonClass}
      onPointerEnter={() => void loadImpl()}
      onFocus={() => void loadImpl()}
      onClick={() => {
        setActivated(true);
      }}
    >
      <Palette className="size-5" aria-hidden="true" />
    </button>
  );
}
