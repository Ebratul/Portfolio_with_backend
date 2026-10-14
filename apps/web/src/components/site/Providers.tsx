"use client";

import { LazyMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

// Toasts only appear after user actions, so the library is fetched after hydration.
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

// Animation features load after first paint; `m.*` components render statically until then.
const loadFeatures = () => import("@/lib/motion-features").then((m) => m.default);

export function Providers({
  defaultTheme,
  children,
}: {
  defaultTheme: "dark" | "light" | "system";
  children: ReactNode;
}) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme={defaultTheme} enableSystem disableTransitionOnChange>
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
      {/* Offset keeps toasts clear of the sticky Save bar in the admin and the back-to-top button. */}
      <Toaster position="bottom-right" offset={{ bottom: 88, right: 24 }} mobileOffset={{ bottom: 88, right: 16 }} theme="system" richColors closeButton />
    </ThemeProvider>
  );
}
