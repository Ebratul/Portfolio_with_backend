"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

export function Slider({ value, onValueChange, "aria-label": ariaLabel, ...props }: {
  value: number;
  onValueChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  "aria-label": string;
}) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={([v]) => {
        if (v !== undefined) onValueChange(v);
      }}
      className="relative flex h-5 w-full touch-none items-center"
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-line">
        <SliderPrimitive.Range className="bg-brand-gradient absolute h-full rounded-full" />
      </SliderPrimitive.Track>
      {/* The accessible name belongs on the thumb (the focusable element), not on the root. */}
      <SliderPrimitive.Thumb aria-label={ariaLabel} className="block size-5 rounded-full border-2 border-primary bg-bg shadow focus-visible:outline-2" />
    </SliderPrimitive.Root>
  );
}
