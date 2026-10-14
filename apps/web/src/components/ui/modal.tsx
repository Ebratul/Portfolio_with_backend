"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Centered dialog (or right-hand sheet with `side`). */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed z-[101] flex flex-col border border-line bg-surface shadow-2xl focus:outline-none",
            side
              ? "inset-y-0 right-0 w-full max-w-lg border-y-0 border-r-0"
              : cn(
                  "left-1/2 top-1/2 max-h-[90vh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl",
                  size === "lg" ? "max-w-3xl" : "max-w-xl",
                ),
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line p-5">
            <div>
              <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close aria-label="Close" className="grid size-8 place-items-center rounded-lg hover:bg-line">
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          {footer ? <footer className="flex justify-end gap-2 border-t border-line p-4">{footer}</footer> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
