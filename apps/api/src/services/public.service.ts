import {
  SKILL_CATEGORIES,
  TIMELINE_TYPES,
  type SkillCategory,
  type TimelineType,
} from "@portfolio/shared";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";

function groupBy<K extends string, T>(keys: readonly K[], items: T[], pick: (item: T) => K): Record<K, T[]> {
  const out = Object.fromEntries(keys.map((k) => [k, [] as T[]])) as Record<K, T[]>;
  for (const item of items) out[pick(item)].push(item);
  return out;
}

export const publicService = {
  /** One aggregated payload so the homepage needs a single request. */
  async home() {
    const [profile, settings, socials, valueCards, skills, projects, timeline, sections] =
      await Promise.all([
        prisma.profile.findUnique({ where: { id: "singleton" } }),
        prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
        prisma.socialLink.findMany({ where: { isVisible: true }, orderBy: { order: "asc" } }),
        prisma.valueCard.findMany({ orderBy: { order: "asc" } }),
        prisma.skill.findMany({ where: { isVisible: true }, orderBy: { order: "asc" } }),
        prisma.project.findMany({
          where: { status: "PUBLISHED", isFeatured: true },
          include: { images: { orderBy: { order: "asc" } } },
          orderBy: { order: "asc" },
        }),
        prisma.timelineItem.findMany({ where: { isVisible: true }, orderBy: { order: "asc" } }),
        prisma.sectionConfig.findMany({ orderBy: { order: "asc" } }),
      ]);

    if (!profile || !settings) {
      throw ApiError.notFound("Site is not set up yet. Run `pnpm db:seed`.");
    }

    return {
      profile,
      settings,
      socials,
      valueCards,
      skills: groupBy<SkillCategory, (typeof skills)[number]>(SKILL_CATEGORIES, skills, (s) => s.category),
      projects,
      timeline: groupBy<TimelineType, (typeof timeline)[number]>(TIMELINE_TYPES, timeline, (t) => t.type),
      sections,
    };
  },
};
