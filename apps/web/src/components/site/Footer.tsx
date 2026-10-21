import { ArrowUpRight, Heart, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import type { Profile, SectionConfig, SiteSettings, SocialLink } from "@portfolio/shared";
import { NAV_LABELS, navSections } from "@/lib/site";
import { BackToTop } from "./BackToTop";
import { SocialIcon } from "./icons";

const headingClass = "mb-4 font-heading text-xs font-bold uppercase tracking-[0.18em] text-fg";
const linkClass =
  "group inline-flex items-center gap-1 text-muted transition-colors hover:text-ink focus-visible:text-ink";

export function Footer({
  profile,
  settings,
  socials,
  sections,
}: {
  profile: Profile;
  settings: SiteSettings;
  socials: SocialLink[];
  sections: SectionConfig[];
}) {
  const links = navSections(sections);

  return (
    <footer className="relative border-t border-line bg-surface/50">
      <div
        aria-hidden="true"
        className="bg-brand-gradient absolute inset-x-0 top-0 h-px opacity-60 [mask-image:linear-gradient(to_right,transparent,#000_30%,#000_70%,transparent)]"
      />
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1.2fr_1fr] lg:gap-8">
          <div>
            <Link href="/" className="font-heading text-2xl font-bold">
              {profile.brandName}
              <span className="text-ink">{profile.brandSuffix}</span>
            </Link>
            <p className="mt-3 max-w-xs leading-relaxed text-muted">{settings.footerText}</p>
            {profile.isAvailable ? (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-medium">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {profile.availabilityText}
              </p>
            ) : null}
          </div>

          <nav aria-label="Footer">
            <h2 className={headingClass}>Quick links</h2>
            <ul className="space-y-2.5">
              {links.map((s) => (
                <li key={s.key}>
                  <Link href={s.key === "hero" ? "/" : `/#${s.key}`} className={linkClass}>
                    {NAV_LABELS[s.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className={headingClass}>Get in touch</h2>
            <ul className="space-y-3 text-muted">
              <li>
                <a href={`mailto:${profile.email}`} className={`${linkClass} break-all`}>
                  <Mail className="mr-1.5 size-4 shrink-0" aria-hidden="true" />
                  {profile.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{profile.location}</span>
              </li>
            </ul>
            <Link
              href="/#contact"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-ink"
            >
              Start a conversation
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {socials.length > 0 ? (
            <div>
              <h2 className={headingClass}>Connect</h2>
              <ul className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.platform} (opens in a new tab)`}
                      title={s.platform}
                      className="grid size-10 place-items-center rounded-full border border-line transition hover:-translate-y-0.5 hover:border-primary hover:text-ink motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                    >
                      <SocialIcon platform={s.platform} icon={s.icon} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {profile.fullName}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5">
            Designed &amp; built with <Heart className="size-4 fill-primary text-primary" aria-label="love" /> by{" "}
            {profile.fullName}
          </p>
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
