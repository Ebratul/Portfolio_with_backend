"use client";

import { m, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { PalettePicker } from "./PalettePicker";
import { ThemeToggle } from "./ThemeToggle";

export interface NavItem {
  key: string;
  label: string;
}

function useScrollSpy(keys: string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(keys[0] ?? null);
  const joined = keys.join("|");

  useEffect(() => {
    if (!enabled) return;
    const els = joined
      .split("|")
      .map((k) => document.getElementById(k))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => {
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
    };
  }, [joined, enabled]);

  return active;
}

// The slide-in menu (Radix Dialog + animation) is fetched on first use; mobile visitors who never
// open it never pay for it.
const loadMenu = () => import("./MobileMenu");
const MobileMenu = dynamic(loadMenu, { ssr: false });

function MobileMenuTrigger({
  items,
  hrefFor,
  isActive,
}: {
  items: NavItem[];
  hrefFor: (key: string) => string;
  isActive: (key: string) => boolean;
}) {
  const [activated, setActivated] = useState(false);
  if (activated) return <MobileMenu items={items} hrefFor={hrefFor} isActive={isActive} defaultOpen />;
  return (
    <button
      type="button"
      aria-label="Open menu"
      className="grid size-10 place-items-center rounded-full border border-line lg:hidden"
      onPointerEnter={() => void loadMenu()}
      onFocus={() => void loadMenu()}
      onClick={() => {
        setActivated(true);
      }}
    >
      <span className="relative block h-3.5 w-5" aria-hidden="true">
        <span className="absolute left-0 top-0 h-0.5 w-5 rounded bg-current" />
        <span className="absolute left-0 top-1.5 h-0.5 w-5 rounded bg-current" />
        <span className="absolute left-0 top-3 h-0.5 w-5 rounded bg-current" />
      </span>
    </button>
  );
}

export function Navbar({
  brandName,
  brandSuffix,
  items,
}: {
  brandName: string;
  brandSuffix: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const active = useScrollSpy(
    items.map((i) => i.key),
    onHome,
  );
  const reduce = useReducedMotion();

  const hrefFor = (key: string): string => (key === "hero" ? (onHome ? "#hero" : "/") : onHome ? `#${key}` : `/#${key}`);
  const isActive = (key: string): boolean =>
    onHome ? active === key : key === "projects" && pathname.startsWith("/projects");

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2 shadow-lg shadow-black/10 sm:px-6"
      >
        <Link href="/" className="font-heading text-lg font-bold tracking-tight" aria-label={`${brandName}${brandSuffix} home`}>
          {brandName}
          <span className="text-ink">{brandSuffix}</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={hrefFor(item.key)}
                aria-current={isActive(item.key) ? "true" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-fg",
                  isActive(item.key) && "text-fg",
                )}
              >
                {isActive(item.key) ? (
                  <m.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary/15"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <PalettePicker />
          <ThemeToggle />
          <MobileMenuTrigger items={items} hrefFor={hrefFor} isActive={isActive} />
        </div>
      </nav>
    </header>
  );
}
