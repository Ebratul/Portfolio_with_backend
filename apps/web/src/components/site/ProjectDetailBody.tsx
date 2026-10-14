import { CheckCircle2, ExternalLink } from "lucide-react";
import { FaGithub as Github } from "react-icons/fa6";
import type { Project } from "@portfolio/shared";
import { ProjectGallery } from "./ProjectGallery";

/** Server-safe description renderer: content is sanitised by the API before it is stored. */
function RichText({ html }: { html: string }) {
  const hasTags = /<\/?[a-z][\s\S]*>/i.test(html);
  return hasTags ? (
    <div className="prose-content" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <p className="whitespace-pre-line text-muted leading-relaxed">{html}</p>
  );
}

/** `headingLevel` keeps the document outline valid: 2 on the page (under the h1), 3 inside the modal. */
export function ProjectDetailBody({ project, headingLevel = 3 }: { project: Project; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const gallery = [
    { url: project.coverUrl, alt: `${project.title} cover` },
    ...project.images.map((img) => ({ url: img.url, alt: img.alt ?? `${project.title} screenshot` })),
  ];

  const links = [
    project.liveUrl && { href: project.liveUrl, label: "Live Preview", icon: ExternalLink },
    project.githubUrl && { href: project.githubUrl, label: project.githubServerUrl ? "Client Code" : "Source Code", icon: Github },
    project.githubServerUrl && { href: project.githubServerUrl, label: "Server Code", icon: Github },
  ].filter((l): l is { href: string; label: string; icon: typeof Github } => Boolean(l));

  return (
    <div className="space-y-8">
      <ProjectGallery images={gallery} />

      {links.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {links.map(({ href, label, icon: Icon }, i) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                i === 0
                  ? "bg-brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-on-primary"
                  : "inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-ink"
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ))}
        </div>
      ) : null}

      <RichText html={project.description} />

      {project.features.length > 0 ? (
        <section aria-labelledby={`feat-${project.id}`}>
          <Heading id={`feat-${project.id}`} className="mb-3 text-xl font-bold">
            Key Features
          </Heading>
          <ul className="grid gap-2 sm:grid-cols-2">
            {project.features.map((f) => (
              <li key={f} className="flex gap-2 text-muted">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ink" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {project.architecture ? (
        <section aria-labelledby={`arch-${project.id}`}>
          <Heading id={`arch-${project.id}`} className="mb-3 text-xl font-bold">
            Architecture
          </Heading>
          <RichText html={project.architecture} />
        </section>
      ) : null}

      {project.techStack.length > 0 ? (
        <section aria-labelledby={`tech-${project.id}`}>
          <Heading id={`tech-${project.id}`} className="mb-3 text-xl font-bold">
            Tech Stack
          </Heading>
          <ul className="flex flex-wrap gap-2">
            {project.techStack.map((t) => (
              <li key={t} className="max-w-full rounded-2xl border border-line bg-bg px-3 py-1 text-sm font-medium [overflow-wrap:anywhere]">
                {t}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
