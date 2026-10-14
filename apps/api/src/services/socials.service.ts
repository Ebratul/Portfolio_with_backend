import { CACHE_TAGS, type ReorderInput, type SocialLinkInput } from "@portfolio/shared";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";

const bust = (): void => {
  revalidateWeb([CACHE_TAGS.home]);
};

export const socialsService = {
  list: () => prisma.socialLink.findMany({ orderBy: { order: "asc" } }),

  async create(input: SocialLinkInput) {
    const max = await prisma.socialLink.aggregate({ _max: { order: true } });
    const link = await prisma.socialLink.create({
      data: { ...input, order: (max._max.order ?? -1) + 1 },
    });
    bust();
    return link;
  },

  async update(id: string, input: Partial<SocialLinkInput>) {
    const link = await prisma.socialLink.update({ where: { id }, data: input });
    bust();
    return link;
  },

  async remove(id: string) {
    await prisma.socialLink.delete({ where: { id } });
    bust();
  },

  async reorder({ items }: ReorderInput) {
    await prisma.$transaction(
      items.map((i) => prisma.socialLink.update({ where: { id: i.id }, data: { order: i.order } })),
    );
    bust();
  },
};
