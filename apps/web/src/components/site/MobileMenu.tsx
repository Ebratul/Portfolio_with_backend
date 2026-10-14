"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { NavItem } from "./Navbar";

export default function MobileMenu({
  items,
  hrefFor,
  isActive,
  defaultOpen = false,
}: {
  items: NavItem[];
  hrefFor: (key: string) => string;
  isActive: (key: string) => boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-10 place-items-center rounded-full border border-line lg:hidden"
      >
        <span className="relative block h-3.5 w-5" aria-hidden="true">
          <span className="absolute left-0 top-0 h-0.5 w-5 rounded bg-current" />
          <span className="absolute left-0 top-1.5 h-0.5 w-5 rounded bg-current" />
          <span className="absolute left-0 top-3 h-0.5 w-5 rounded bg-current" />
        </span>
      </Dialog.Trigger>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <m.div
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <m.div
                className="fixed inset-y-0 right-0 z-[61] flex w-72 max-w-[85vw] flex-col gap-2 bg-surface p-6 shadow-2xl"
                initial={reduce ? false : { x: "100%" }}
                animate={{ x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: "100%" }}
                transition={{ type: "tween", duration: 0.28 }}
              >
                <Dialog.Title className="mb-4 font-heading text-lg font-bold">Menu</Dialog.Title>
                {items.map((item) => (
                  <Link
                    key={item.key}
                    href={hrefFor(item.key)}
                    onClick={() => {
                      setOpen(false);
                    }}
                    aria-current={isActive(item.key) ? "true" : undefined}
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium text-muted hover:bg-primary/10 hover:text-fg",
                      isActive(item.key) && "bg-primary/15 text-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
