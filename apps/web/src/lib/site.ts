import type { HomePayload, SectionConfig, SectionKey } from "@portfolio/shared";

/** Short navbar labels per section key (section titles can be long, e.g. "Technical Arsenal"). */
export const NAV_LABELS: Record<SectionKey, string> = {
  hero: "Home",
  about: "About",
  skills: "Skills",
  projects: "Projects",
  journey: "Journey",
  contact: "Contact",
  activity: "Activity",
};

/** Sections that appear in the navbar (activity is a page section only). */
export function navSections(sections: SectionConfig[]): SectionConfig[] {
  return sections.filter((s) => s.isVisible && s.key !== "activity");
}

export const visibleSections = (home: HomePayload): SectionConfig[] =>
  home.sections.filter((s) => s.isVisible);

export function formatYears(start: string, end: string | null, single = false): string {
  const from = new Date(start).getUTCFullYear();
  if (single) return String(from);
  const to = end ? String(new Date(end).getUTCFullYear()) : "PRESENT";
  return `${from} – ${to}`;
}

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

/** Tiny dark placeholder used as a blur-up while images stream in. */
export const BLUR_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9"><rect width="16" height="9" fill="#1f2937"/></svg>',
)}`;

export const ACCENT_PRESETS = [
  { name: "Coral", primary: "#FF4D6D", accent: "#E94584" },
  { name: "Violet", primary: "#8B5CF6", accent: "#D946EF" },
  { name: "Cyan", primary: "#06B6D4", accent: "#3B82F6" },
  { name: "Emerald", primary: "#10B981", accent: "#14B8A6" },
  { name: "Amber", primary: "#F59E0B", accent: "#F97316" },
] as const;
