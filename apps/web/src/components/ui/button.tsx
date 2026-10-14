import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-brand-gradient text-on-primary hover:opacity-90",
  outline: "border border-line hover:border-primary hover:text-ink",
  ghost: "hover:bg-line",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  icon: "size-9",
};

export const buttonClasses = (variant: Variant = "primary", size: Size = "md", className?: string): string =>
  cn(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );

export function Button({
  variant,
  size,
  className,
  asChild,
  ref,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} type={asChild ? undefined : type} className={buttonClasses(variant, size, className)} {...props} />;
}
