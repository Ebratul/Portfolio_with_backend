import { CACHE_TAGS, type ReorderInput, type SkillInput } from "@portfolio/shared";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";

const bust = (): void => {
  revalidateWeb([CACHE_TAGS.home]);
};

export const skillsService = {
  list: () => prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),

  async create(input: SkillInput) {
    const max = await prisma.skill.aggregate({
      where: { category: input.category },
      _max: { order: true },
    });
    const skill = await prisma.skill.create({
      data: { ...input, order: (max._max.order ?? -1) + 1 },
    });
    bust();
    return skill;
  },

  async update(id: string, input: Partial<SkillInput>) {
    const skill = await prisma.skill.update({ where: { id }, data: input });
    bust();
    return skill;
  },

  async remove(id: string) {
    await prisma.skill.delete({ where: { id } });
    bust();
  },

  async reorder({ items }: ReorderInput) {
    await prisma.$transaction(
      items.map((i) => prisma.skill.update({ where: { id: i.id }, data: { order: i.order } })),
    );
    bust();
  },
};
