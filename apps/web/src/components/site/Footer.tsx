import { Heart } from "lucide-react";
import Link from "next/link";
import type { Profile, SectionConfig, SiteSettings, SocialLink } from "@portfolio/shared";
import { NAV_LABELS, navSections } from "@/lib/site";
import { BackToTop } from "./BackToTop";
import { SocialIcon } from "./icons";

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
  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-heading text-2xl font-bold">
              {profile.brandName}
              <span className="text-ink">{profile.brandSuffix}</span>
            </Link>
            <p className="mt-3 max-w-sm text-muted">{settings.footerText}</p>
          </div>
          <nav aria-label="Footer">
            <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider">Quick links</h2>
            <ul className="space-y-2 text-muted">
              {navSections(sections).map((s) => (
                <li key={s.key}>
                  <Link href={s.key === "hero" ? "/" : `/#${s.key}`} className="hover:text-ink">
                    {NAV_LABELS[s.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {socials.length > 0 ? (
            <div>
              <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider">Connect</h2>
              <ul className="flex flex-wrap gap-3">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.platform} (opens in a new tab)`}
                      className="grid size-10 place-items-center rounded-full border border-line transition hover:border-primary hover:text-ink"
                    >
                      <SocialIcon platform={s.platform} icon={s.icon} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <p className="flex items-center gap-1.5">
            Designed &amp; Built with <Heart className="size-4 fill-primary text-primary" aria-label="love" /> by {profile.fullName}
          </p>
          <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
