import {
  DM_Sans,
  Inter,
  Manrope,
  Outfit,
  Plus_Jakarta_Sans,
  Poppins,
  Sora,
  Space_Grotesk,
} from "next/font/google";

// next/font needs literal options at every call site. preload:false keeps font files off the critical
// path (they would compete with the hero image for bandwidth and hurt Largest Contentful Paint), and
// means only the fonts actually referenced via SiteSettings are ever downloaded. display:swap shows
// text immediately in a metric-adjusted fallback, so the swap causes no visible layout shift.
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-inter" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-outfit" });
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["400", "500", "600", "700"],
  variable: "--f-poppins",
});
const space = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-space-grotesk" });
const dm = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-dm-sans" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-manrope" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--f-plus-jakarta-sans",
});
const sora = Sora({ subsets: ["latin"], display: "swap", preload: false, variable: "--f-sora" });

export const fontClassNames = [inter, outfit, poppins, space, dm, manrope, jakarta, sora]
  .map((f) => f.variable)
  .join(" ");

export const fontVar = (name: string): string => `var(--f-${name.toLowerCase().replaceAll(" ", "-")})`;
