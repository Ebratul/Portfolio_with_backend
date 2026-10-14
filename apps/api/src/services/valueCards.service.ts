import { CACHE_TAGS, type ReorderInput, type ValueCardInput } from "@portfolio/shared";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";

const bust = (): void => {
  revalidateWeb([CACHE_TAGS.home]);
};

export const valueCardsService = {
  list: () => prisma.valueCard.findMany({ orderBy: { order: "asc" } }),

  async create(input: ValueCardInput) {
    const max = await prisma.valueCard.aggregate({ _max: { order: true } });
    const card = await prisma.valueCard.create({
      data: { ...input, order: (max._max.order ?? -1) + 1 },
    });
    bust();
    return card;
  },

  async update(id: string, input: Partial<ValueCardInput>) {
    const card = await prisma.valueCard.update({ where: { id }, data: input });
    bust();
    return card;
  },

  async remove(id: string) {
    await prisma.valueCard.delete({ where: { id } });
    bust();
  },

  async reorder({ items }: ReorderInput) {
    await prisma.$transaction(
      items.map((i) => prisma.valueCard.update({ where: { id: i.id }, data: { order: i.order } })),
    );
    bust();
  },
};
