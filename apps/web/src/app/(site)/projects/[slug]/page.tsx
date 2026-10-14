import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectDetailBody } from "@/components/site/ProjectDetailBody";
import { ApiRequestError, getProject } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  try {
    return await getProject(slug);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await getProject(slug);
    return {
      title: p.title,
      description: p.summary,
      alternates: { canonical: `/projects/${p.slug}` },
      openGraph: { title: p.title, description: p.summary, images: [{ url: p.coverUrl }] },
      twitter: { card: "summary_large_image", title: p.title, description: p.summary, images: [p.coverUrl] },
    };
  } catch {
    return { title: "Project not found" };
  }
}

export default async function ProjectPage({ params }: Params) {
  const project = await load((await params).slug);
  return (
    <article className="mx-auto max-w-4xl px-4 pb-24 pt-36 sm:px-6">
      <Link href="/projects" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All projects
      </Link>
      <h1 className="text-4xl font-extrabold sm:text-5xl">{project.title}</h1>
      <p className="mt-2 text-lg font-medium text-ink">{project.subtitle}</p>
      {project.role ? <p className="mt-1 text-sm text-muted">Role: {project.role}</p> : null}
      <div className="mt-8">
        <ProjectDetailBody project={project} headingLevel={2} />
      </div>
    </article>
  );
}
