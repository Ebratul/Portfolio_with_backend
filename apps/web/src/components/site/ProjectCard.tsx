"use client";

import { ExternalLink, Eye } from "lucide-react";
import { FaGithub as Github } from "react-icons/fa6";
import Image from "next/image";
import type { Project } from "@portfolio/shared";
import { BLUR_DATA_URL } from "@/lib/site";

/** `headingLevel`: 3 under a section h2 on the homepage, 2 on /projects (which has the page h1). */
export function ProjectCard({
  project,
  onOpen,
  headingLevel = 3,
  priority = false,
  preview = false,
}: {
  project: Project;
  onOpen: (p: Project) => void;
  headingLevel?: 2 | 3;
  /** Above-the-fold cards load eagerly (they can be the page's LCP); the rest stay lazy. */
  priority?: boolean;
  /** Admin live preview: not a trigger for the details modal, but the Live/GitHub links work. */
  preview?: boolean;
}) {
  // Only real http(s) URLs become links, so a half-typed value in the admin form never yields a broken link.
  const isUrl = (v: string | null): v is string => v !== null && /^https?:\/\/\S+$/i.test(v);
  const live = isUrl(project.liveUrl) ? project.liveUrl : null;
  const repo = isUrl(project.githubUrl) ? project.githubUrl : null;
  const bodyClass = "flex flex-1 flex-col p-4 text-left";
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[0_10px_40px_var(--glow)]">
      {preview ? (
        <div className={bodyClass}>
        {/* Browser-window mockup */}
        <div className="overflow-hidden rounded-xl border border-line bg-bg">
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2" aria-hidden="true">
            <span className="size-2 rounded-full bg-red-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
          </div>
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={project.coverUrl}
              alt={`${project.title} preview`}
              fill
              {...(priority ? { priority: true, fetchPriority: "high" as const } : { loading: "lazy" as const })}
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        </div>
        <Heading className="mt-5 text-xl font-bold">{project.title}</Heading>
        <p className="mt-1 text-sm font-medium text-ink">{project.subtitle}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.summary}</p>
        </div>
      ) : (
      <button
        type="button"
        onClick={() => {
          onOpen(project);
        }}
        aria-label={`View details of ${project.title}`}
        className={bodyClass}
      >
        {/* Browser-window mockup */}
        <div className="overflow-hidden rounded-xl border border-line bg-bg">
          <div className="flex items-center gap-1.5 border-b border-line px-3 py-2" aria-hidden="true">
            <span className="size-2 rounded-full bg-red-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
          </div>
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={project.coverUrl}
              alt={`${project.title} preview`}
              fill
              {...(priority ? { priority: true, fetchPriority: "high" as const } : { loading: "lazy" as const })}
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        </div>
        <Heading className="mt-5 text-xl font-bold">{project.title}</Heading>
        <p className="mt-1 text-sm font-medium text-ink">{project.subtitle}</p>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{project.summary}</p>
      </button>
      )}

      <div className="flex gap-3 px-4 pb-4">
        {live ? (
          <a
            href={live}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brand-gradient flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Live Preview<span className="sr-only"> of {project.title} (opens in a new tab)</span>
          </a>
        ) : (
          <button
            type="button"
            disabled={preview}
            onClick={() => {
              onOpen(project);
            }}
            className="bg-brand-gradient flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-default disabled:opacity-60"
          >
            <Eye className="size-4" aria-hidden="true" />
            View Details
          </button>
        )}
        {repo ? (
          <a
            href={repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.title} on GitHub (opens in a new tab)`}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line transition hover:border-primary hover:text-ink"
          >
            <Github className="size-5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
