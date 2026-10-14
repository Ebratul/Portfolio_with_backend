import type { ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Pure CSS (see `.reveal` in globals.css): no JavaScript, no hydration and no
 * hidden-until-JS content. Browsers without scroll-driven animations, and visitors who prefer reduced
 * motion, simply see the content immediately.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  return <div className={className ? `reveal ${className}` : "reveal"}>{children}</div>;
}
