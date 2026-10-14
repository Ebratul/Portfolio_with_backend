import { Activity as ActivityIcon, ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import type { Profile, SectionConfig } from "@portfolio/shared";
import { getGithubActivity } from "@/lib/api";
import { Heatmap } from "./Heatmap";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

/** Hidden entirely when no GitHub username is configured. */
export async function Activity({ section, profile }: { section: SectionConfig; profile: Profile }) {
  const username = profile.githubUsername;
  if (!username) return null;
  const activity = await getGithubActivity();

  return (
    <section id="activity" aria-labelledby="activity-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div id="activity-title">
          <SectionHeader title={section.title} subtitle={section.subtitle} />
        </div>
        <Reveal className="card p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-ink">
                <FaGithub className="size-6" aria-hidden="true" />
              </span>
              <div>
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-heading text-lg font-bold hover:text-ink"
                >
                  @{username}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <ActivityIcon className="size-3.5 text-ink" aria-hidden="true" />
                  {activity ? `${activity.total.toLocaleString("en-US")} contributions in the last year` : "GitHub activity"}
                </p>
              </div>
            </div>
          </div>
          {activity ? (
            <Heatmap activity={activity} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">The contribution graph is temporarily unavailable.</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
