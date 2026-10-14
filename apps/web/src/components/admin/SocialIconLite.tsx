import { Globe } from "lucide-react";
import type { IconType } from "react-icons";
import { FaDev, FaDiscord, FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn, FaTelegram, FaWhatsapp, FaXTwitter, FaYoutube } from "react-icons/fa6";

const BRANDS: Record<string, IconType> = {
  github: FaGithub, linkedin: FaLinkedinIn, x: FaXTwitter, twitter: FaXTwitter, facebook: FaFacebookF,
  instagram: FaInstagram, youtube: FaYoutube, whatsapp: FaWhatsapp, telegram: FaTelegram, discord: FaDiscord, dev: FaDev, devto: FaDev,
};

/** Brand icons only (small); unknown platforms fall back to a globe. */
export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = BRANDS[platform.toLowerCase()];
  return Icon ? <Icon aria-hidden="true" className={className} /> : <Globe aria-hidden="true" className={className} />;
}
