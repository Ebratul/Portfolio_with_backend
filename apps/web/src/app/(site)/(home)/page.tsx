import type { ReactNode } from "react";
import type { SectionKey } from "@portfolio/shared";
import { Activity } from "@/components/site/Activity";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";
import { Hero } from "@/components/site/Hero";
import { Journey } from "@/components/site/Journey";
import { Projects } from "@/components/site/Projects";
import { Skills } from "@/components/site/Skills";
import { getHome } from "@/lib/api";
import { env } from "../../../../env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const home = await getHome();
  const { profile, sections, socials, valueCards, skills, projects, timeline } = home;
  const visible = sections.filter((s) => s.isVisible);
  const has = (key: SectionKey): boolean => visible.some((s) => s.key === key);

  const render: Record<SectionKey, (s: (typeof sections)[number]) => ReactNode> = {
    hero: () => <Hero profile={profile} hasSection={has} />,
    about: (s) => <About section={s} profile={profile} valueCards={valueCards} />,
    skills: (s) => <Skills section={s} skills={skills} />,
    projects: (s) => <Projects section={s} projects={projects} showAllLink />,
    journey: (s) => <Journey section={s} timeline={timeline} />,
    contact: (s) => <Contact section={s} profile={profile} socials={socials} />,
    activity: (s) => <Activity section={s} profile={profile} />,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    jobTitle: profile.roles[0],
    description: profile.shortBio,
    url: env.NEXT_PUBLIC_SITE_URL,
    email: `mailto:${profile.email}`,
    ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
    address: { "@type": "PostalAddress", addressLocality: profile.location },
    sameAs: socials.map((s) => s.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so the JSON can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
      />
      {visible.map((s) => (
        <div key={s.key}>{render[s.key](s)}</div>
      ))}
    </>
  );
}
