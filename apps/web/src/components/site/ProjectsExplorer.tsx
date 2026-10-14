"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Project } from "@portfolio/shared";
import { cn } from "@/lib/cn";
import { ProjectCard } from "./ProjectCard";

/** All-projects page: filter by tech stack. */
// The dialog, gallery and rich detail view are only fetched when a card is first opened.
const ProjectModal = dynamic(() => import("./ProjectModal").then((m) => m.ProjectModal), { ssr: false });

export function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [tech, setTech] = useState<string | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const allTech = useMemo(() => [...new Set(projects.flatMap((p) => p.techStack))].sort(), [projects]);
  const shown = tech ? projects.filter((p) => p.techStack.includes(tech)) : projects;

  return (
    <>
      {allTech.length > 0 ? (
        <div role="group" aria-label="Filter by technology" className="mb-10 flex flex-wrap justify-center gap-2">
          {[null, ...allTech].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              aria-pressed={tech === t}
              onClick={() => {
                setTech(t);
              }}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                tech === t
                  ? "bg-brand-gradient border-transparent text-on-primary"
                  : "border-line text-muted hover:border-primary hover:text-fg",
              )}
            >
              {t ?? "All"}
            </button>
          ))}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {shown.length} projects shown
      </p>
      {shown.length === 0 ? (
        <p className="text-center text-muted">No projects match this filter.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <li key={p.id}>
              <ProjectCard project={p} onOpen={setSelected} headingLevel={2} priority={i < 3} />
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <ProjectModal
          project={selected}
          onClose={() => {
            setSelected(null);
          }}
        />
      ) : null}
    </>
  );
}
