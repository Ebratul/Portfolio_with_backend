import Image from "next/image";
import type { Profile, SectionConfig, ValueCard } from "@portfolio/shared";
import { BLUR_DATA_URL, initials } from "@/lib/site";
import { LucideByName } from "./icons";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

/** Wraps every occurrence of a highlight word in an accent-coloured span. */
function Highlighted({ text, words }: { text: string; words: string[] }) {
  const escaped = words.filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (escaped.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        words.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="text-ink">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function About({
  section,
  profile,
  valueCards,
}: {
  section: SectionConfig;
  profile: Profile;
  valueCards: ValueCard[];
}) {
  const image = profile.aboutImageUrl ?? profile.avatarUrl;
  return (
    <section id="about" aria-labelledby="about-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="about-title">
          <SectionHeader title={section.title} subtitle={section.subtitle} />
        </div>
        <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-square overflow-hidden rounded-full border border-line bg-surface p-2">
              <div className="relative size-full overflow-hidden rounded-full">
                {image ? (
                  <Image
                    src={image}
                    alt={`${profile.fullName} at work`}
                    fill
                    sizes="(min-width: 1024px) 384px, 80vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-gradient grid size-full place-items-center font-heading text-7xl font-bold">
                    {initials(profile.fullName)}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-brand-gradient absolute -bottom-3 right-2 rounded-2xl px-5 py-3 text-on-primary shadow-xl sm:right-0">
              <p className="font-heading text-2xl font-bold leading-none">{profile.experienceYears}+</p>
              <p className="text-xs font-medium opacity-90">{profile.experienceYears === 1 ? "Year" : "Years"} Experience</p>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <h3 className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                <Highlighted text={profile.aboutHeading} words={profile.aboutHighlights} />
              </h3>
            </Reveal>
            <div className="mt-6 space-y-4 text-muted">
              {profile.aboutParagraphs.map((p, i) => (
                <Reveal key={i} delay={0.05 * (i + 1)}>
                  <p className="leading-relaxed">{p}</p>
                </Reveal>
              ))}
            </div>
            {valueCards.length > 0 ? (
              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {valueCards.map((card, i) => (
                  <li key={card.id}>
                    <Reveal delay={0.08 * i} className="card flex h-full flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-1 hover:shadow-[0_8px_30px_var(--glow)]">
                      <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-ink">
                        <LucideByName name={card.icon} className="size-6" />
                      </span>
                      <span className="font-heading font-semibold">{card.title}</span>
                      {card.description ? <span className="text-sm text-muted">{card.description}</span> : null}
                    </Reveal>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
