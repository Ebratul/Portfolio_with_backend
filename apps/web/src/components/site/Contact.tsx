import { Mail, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import type { Profile, SectionConfig, SocialLink } from "@portfolio/shared";
import { ContactFormLazy } from "./ContactFormLazy";
import { CopyButton } from "./CopyButton";
import { SocialIcon } from "./icons";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

function Row({ icon, label, children, action }: { icon: React.ReactNode; label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <li className="card flex items-center gap-4 p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-ink">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <div className="truncate font-medium">{children}</div>
      </div>
      {action}
    </li>
  );
}

export function Contact({
  section,
  profile,
  socials,
}: {
  section: SectionConfig;
  profile: Profile;
  socials: SocialLink[];
}) {
  const whatsappDigits = profile.whatsapp?.replace(/\D/g, "");
  return (
    <section id="contact" aria-labelledby="contact-title" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="contact-title">
          <SectionHeader title={section.title} subtitle={section.subtitle} />
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h3 className="text-3xl font-bold leading-tight sm:text-4xl">
              Let&apos;s build something
              <br />
              <span className="text-gradient">meaningful together.</span>
            </h3>
            <p className="mt-4 max-w-md text-muted">
              Have a project in mind or just want to say hello? Send a message and I&apos;ll get back to you as soon as I can.
            </p>
            <ul className="mt-8 space-y-3">
              <Row icon={<Mail className="size-5" aria-hidden="true" />} label="Email" action={<CopyButton value={profile.email} label="email" />}>
                <a href={`mailto:${profile.email}`} className="hover:text-ink">{profile.email}</a>
              </Row>
              {profile.phone ? (
                <Row icon={<Phone className="size-5" aria-hidden="true" />} label="Phone" action={<CopyButton value={profile.phone} label="phone number" />}>
                  <a href={`tel:${profile.phone.replace(/\s/g, "")}`} className="hover:text-ink">{profile.phone}</a>
                </Row>
              ) : null}
              {whatsappDigits ? (
                <Row icon={<FaWhatsapp className="size-5" aria-hidden="true" />} label="WhatsApp">
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                    Chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </Row>
              ) : null}
              <Row icon={<MapPin className="size-5" aria-hidden="true" />} label="Location">
                {profile.location}
              </Row>
            </ul>
            {socials.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-3" aria-label="Social links">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.platform} (opens in a new tab)`}
                      className="grid size-11 place-items-center rounded-full border border-line transition hover:-translate-y-0.5 hover:border-primary hover:text-ink"
                    >
                      <SocialIcon platform={s.platform} icon={s.icon} className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>
          <Reveal delay={0.1}>
            <ContactFormLazy />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
