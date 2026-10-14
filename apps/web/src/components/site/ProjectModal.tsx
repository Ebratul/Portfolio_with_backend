"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Link2, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@portfolio/shared";
import { ProjectDetailBody } from "./ProjectDetailBody";

export function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  // The modal is controlled (no <Dialog.Trigger>), so remember which card opened it to return focus there.
  const [opener] = useState<Element | null>(() => document.activeElement);

  async function copyLink(slug: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/projects/${slug}`);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      /* clipboard blocked: the full-page link beside it still works */
    }
  }

  return (
    <Dialog.Root
      open={project !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (opener instanceof HTMLElement) opener.focus();
          }}
          className="fixed inset-x-3 bottom-3 top-3 z-[81] mx-auto flex max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl sm:inset-y-8"
        >
          {project ? (
            <>
              <header className="flex items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
                <div>
                  <Dialog.Title className="text-2xl font-bold">{project.title}</Dialog.Title>
                  <p className="mt-1 text-sm font-medium text-ink">{project.subtitle}</p>
                  {project.role ? <p className="mt-1 text-xs text-muted">Role: {project.role}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void copyLink(project.slug)}
                    aria-label="Copy shareable link"
                    className="grid size-10 place-items-center rounded-full border border-line hover:border-primary"
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Link2 className="size-4" />}
                  </button>
                  <Link
                    href={`/projects/${project.slug}`}
                    aria-label="Open full page"
                    className="grid size-10 place-items-center rounded-full border border-line hover:border-primary"
                  >
                    <Maximize2 className="size-4" aria-hidden="true" />
                  </Link>
                  <Dialog.Close
                    aria-label="Close"
                    className="grid size-10 place-items-center rounded-full border border-line hover:border-primary"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </Dialog.Close>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <ProjectDetailBody project={project} />
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
