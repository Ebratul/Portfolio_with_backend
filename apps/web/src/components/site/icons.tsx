import { icons as lucideIcons, Globe, Sparkles, type LucideProps } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaDev,
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import * as Si from "react-icons/si";

/**
 * Server-only icon resolvers. The icon sets are large (thousands of icons), so they are resolved
 * during server rendering and only the chosen SVG is sent to the browser.
 */

/** Old lucide names that were renamed; the CMS may still store them. */
const LUCIDE_ALIASES: Record<string, string> = { Code2: "CodeXml" };

export function LucideByName({ name, ...props }: { name: string } & LucideProps) {
  const key = LUCIDE_ALIASES[name] ?? name;
  const Icon = (lucideIcons as Record<string, React.ComponentType<LucideProps> | undefined>)[key] ?? Sparkles;
  return <Icon aria-hidden="true" {...props} />;
}

export function SkillIcon({
  name,
  color,
  className,
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  const Icon = (Si as Record<string, IconType | undefined>)[name] ?? Sparkles;
  return (
    <Icon
      aria-hidden="true"
      className={className}
      {...(color ? { style: { color } } : {})}
    />
  );
}

const SOCIAL: Record<string, IconType> = {
  github: FaGithub,
  linkedin: FaLinkedinIn,
  x: FaXTwitter,
  twitter: FaXTwitter,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  discord: FaDiscord,
  devto: FaDev,
  dev: FaDev,
};

export function SocialIcon({ platform, icon, className }: { platform: string; icon: string; className?: string }) {
  const Brand = SOCIAL[platform.toLowerCase()];
  if (Brand) return <Brand aria-hidden="true" className={className} />;
  const key = LUCIDE_ALIASES[icon] ?? icon;
  const Fallback = (lucideIcons as Record<string, React.ComponentType<LucideProps> | undefined>)[key] ?? Globe;
  return <Fallback aria-hidden="true" className={className} />;
}
