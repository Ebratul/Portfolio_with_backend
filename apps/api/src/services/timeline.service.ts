import {
  CACHE_TAGS,
  type ReorderInput,
  type TimelineInput,
  type TimelineType,
} from "@portfolio/shared";
import { destroyAsset, replaceAsset } from "../lib/cloudinary";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";

const bust = (): void => {
  revalidateWeb([CACHE_TAGS.home]);
};

type TimelineUpdate = Partial<Omit<TimelineInput, never>>;

export const timelineService = {
  list: (type?: TimelineType) =>
    prisma.timelineItem.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: "asc" }, { order: "asc" }],
    }),

  async create(input: TimelineInput) {
    const max = await prisma.timelineItem.aggregate({
      where: { type: input.type },
      _max: { order: true },
    });
    const item = await prisma.timelineItem.create({
      data: { ...input, order: (max._max.order ?? -1) + 1 },
    });
    bust();
    return item;
  },

  async update(id: string, input: TimelineUpdate) {
    const old = await prisma.timelineItem.findUnique({ where: { id } });
    if (!old) throw ApiError.notFound();
    const item = await prisma.timelineItem.update({ where: { id }, data: input });
    await replaceAsset(old.imagePublicId, item.imagePublicId);
    bust();
    return item;
  },

  async remove(id: string) {
    const item = await prisma.timelineItem.delete({ where: { id } });
    await destroyAsset(item.imagePublicId);
    bust();
  },

  async reorder({ items }: ReorderInput) {
    await prisma.$transaction(
      items.map((i) => prisma.timelineItem.update({ where: { id: i.id }, data: { order: i.order } })),
    );
    bust();
  },
};
