"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import type { Project, SectionConfig } from "@portfolio/shared";
import { ProjectCard } from "./ProjectCard";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

// The dialog, gallery and rich detail view are only fetched when a card is first opened.
const ProjectModal = dynamic(() => import("./ProjectModal").then((m) => m.ProjectModal), { ssr: false });

export function Projects({
  section,
  projects,
  showAllLink,
}: {
  section: SectionConfig;
  projects: Project[];
  showAllLink: boolean;
}) {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <section id="projects" aria-labelledby="projects-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="projects-title">
          <SectionHeader title={section.title} subtitle={section.subtitle} />
        </div>
        {projects.length === 0 ? (
          <p className="text-center text-muted">Projects will appear here soon.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={0.07 * (i % 3)} className="h-full">
                  <ProjectCard project={p} onOpen={setSelected} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
        {showAllLink ? (
          <div className="mt-12 text-center">
            <Link
              href="/projects"
              className="inline-flex rounded-full border border-line px-7 py-3 font-semibold transition hover:border-primary hover:text-ink"
            >
              View all projects
            </Link>
          </div>
        ) : null}
      </div>
      {selected ? (
        <ProjectModal
          project={selected}
          onClose={() => {
            setSelected(null);
          }}
        />
      ) : null}
    </section>
  );
}
