import { CACHE_TAGS, type ReorderInput, type SectionConfigUpdate } from "@portfolio/shared";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";

const bust = (): void => {
  revalidateWeb([CACHE_TAGS.home]);
};

/** Sections are created by the seed; the admin can edit, hide and reorder but not add or delete. */
export const sectionsService = {
  list: () => prisma.sectionConfig.findMany({ orderBy: { order: "asc" } }),

  async update(id: string, input: SectionConfigUpdate) {
    const section = await prisma.sectionConfig.update({ where: { id }, data: input });
    bust();
    return section;
  },

  async reorder({ items }: ReorderInput) {
    await prisma.$transaction(
      items.map((i) => prisma.sectionConfig.update({ where: { id: i.id }, data: { order: i.order } })),
    );
    bust();
  },
};
