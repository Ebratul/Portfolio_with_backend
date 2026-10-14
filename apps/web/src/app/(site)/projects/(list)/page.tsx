import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/site/ProjectsExplorer";
import { SectionHeader } from "@/components/site/SectionHeader";
import { getHome, getProjects } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects", alternates: { canonical: "/projects" } };

export default async function ProjectsPage() {
  const [projects, home] = await Promise.all([getProjects(), getHome()]);
  const section = home.sections.find((s) => s.key === "projects");
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-36 sm:px-6">
      <SectionHeader level={1} title={section?.title ?? "Projects"} subtitle={section?.subtitle ?? null} />
      <ProjectsExplorer projects={projects} />
    </div>
  );
}
