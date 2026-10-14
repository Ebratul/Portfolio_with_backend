import Image from "next/image";
import { preconnect } from "react-dom";
import type { Profile, SectionKey } from "@portfolio/shared";
import { BLUR_DATA_URL, initials } from "@/lib/site";
import { TypingText } from "./TypingText";

export function Hero({ profile, hasSection }: { profile: Profile; hasSection: (key: SectionKey) => boolean }) {
  const years = profile.experienceYears;
  // Open the connection to the image CDN (e.g. Cloudinary) before the <img> is parsed.
  if (profile.avatarUrl?.startsWith("http")) preconnect(new URL(profile.avatarUrl).origin);
  return (
    <section id="hero" aria-label="Introduction" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 lg:pb-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="text-center lg:text-left">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {profile.badgeText}
            </span>
          </div>
          <div className="animate-rise [animation-delay:80ms]">
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              <span className="block text-2xl font-semibold text-muted sm:text-3xl">I&apos;m</span>
              <span className="text-gradient block">{profile.fullName}</span>
            </h1>
          </div>
          <div className="animate-rise [animation-delay:160ms]">
            <p className="mt-4 min-h-[2.25rem] font-heading text-2xl font-semibold sm:text-3xl">
              <TypingText words={profile.roles} />
            </p>
          </div>
          <div className="animate-rise [animation-delay:240ms]">
            <p className="mx-auto mt-5 max-w-xl text-lg text-fg/90 lg:mx-0">{profile.tagline}</p>
            <p className="mx-auto mt-3 max-w-xl text-muted lg:mx-0">{profile.shortBio}</p>
          </div>
          <div className="animate-rise mt-8 flex flex-wrap justify-center gap-4 [animation-delay:320ms] lg:justify-start">
            <a
              href={hasSection("contact") ? "#contact" : `mailto:${profile.email}`}
              className="bg-brand-gradient inline-flex items-center rounded-full px-7 py-3 font-semibold text-on-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_var(--glow)]"
            >
              Get In Touch
            </a>
            {profile.resumeUrl ? (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-line px-7 py-3 font-semibold transition hover:-translate-y-0.5 hover:border-primary hover:text-ink"
              >
                Resume<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </div>

        <div className="animate-rise relative mx-auto w-full max-w-sm [animation-delay:200ms]">
          <div className="relative aspect-square">
            <div
              aria-hidden="true"
              className="bg-brand-gradient animate-spin-slow absolute -inset-1.5 rounded-full opacity-80 blur-md"
            />
            <div className="bg-brand-gradient absolute -inset-1 rounded-full" aria-hidden="true" />
            <div className="group relative size-full overflow-hidden rounded-full border-4 border-bg bg-surface">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={`Portrait of ${profile.fullName}`}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 384px, 80vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover grayscale transition duration-500 group-hover:grayscale-0"
                />
              ) : (
                <span className="grid size-full place-items-center font-heading text-7xl font-bold text-gradient">
                  {initials(profile.fullName)}
                </span>
              )}
            </div>
          </div>
          <div className="glass animate-float-slow absolute -left-2 bottom-8 rounded-2xl px-4 py-3 shadow-xl sm:-left-8">
            <p className="font-heading text-2xl font-bold leading-none text-ink">{years}</p>
            <p className="text-xs text-muted">{years === 1 ? "year" : "years"} Experience</p>
          </div>
          {profile.isAvailable ? (
            <div className="glass absolute -right-2 top-8 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-xl sm:-right-6">
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              {profile.availabilityText}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
