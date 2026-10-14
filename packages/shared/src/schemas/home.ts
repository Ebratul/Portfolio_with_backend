import type { Profile, SocialLink, ValueCard } from "./profile";
import type { GroupedSkills } from "./skill";
import type { Project } from "./project";
import type { GroupedTimeline } from "./timeline";
import type { SectionConfig, SiteSettings } from "./site";

export interface HomePayload {
  profile: Profile;
  socials: SocialLink[];
  valueCards: ValueCard[];
  skills: GroupedSkills;
  projects: Project[];
  timeline: GroupedTimeline;
  sections: SectionConfig[];
  settings: SiteSettings;
}

export const CACHE_TAGS = {
  home: "home",
  projects: "projects",
  project: (slug: string) => `project:${slug}`,
  github: "github",
} as const;
