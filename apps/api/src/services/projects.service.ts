import type { Prisma } from "@prisma/client";
import {
  CACHE_TAGS,
  type ProjectImageInput,
  type ProjectInput,
  type ProjectStatus,
  type ProjectUpdateInput,
  type ReorderInput,
} from "@portfolio/shared";
import { destroyAsset, replaceAsset } from "../lib/cloudinary";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";
import { sanitizeRichText } from "../lib/sanitize";

const withImages = { images: { orderBy: { order: "asc" } } } satisfies Prisma.ProjectInclude;

const bust = (...slugs: string[]): void => {
  revalidateWeb([
    CACHE_TAGS.home,
    CACHE_TAGS.projects,
    ...slugs.map((s) => CACHE_TAGS.project(s)),
  ]);
};

function clean<T extends { description?: string; architecture?: string | null }>(input: T): T {
  return {
    ...input,
    ...(input.description !== undefined ? { description: sanitizeRichText(input.description) } : {}),
    ...(input.architecture ? { architecture: sanitizeRichText(input.architecture) } : {}),
  };
}

async function getOrThrow(id: string) {
  const project = await prisma.project.findUnique({ where: { id }, include: withImages });
  if (!project) throw ApiError.notFound("Project not found");
  return project;
}

export interface ProjectFilters {
  search?: string | undefined;
  status?: ProjectStatus | undefined;
  tech?: string | undefined;
}

export const projectsService = {
  list(filters: ProjectFilters = {}) {
    const where: Prisma.ProjectWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.tech ? { techStack: { has: filters.tech } } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { subtitle: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.project.findMany({ where, include: withImages, orderBy: { order: "asc" } });
  },

  getById: getOrThrow,

  async create(input: ProjectInput) {
    const max = await prisma.project.aggregate({ _max: { order: true } });
    const project = await prisma.project.create({
      data: { ...clean(input), order: (max._max.order ?? -1) + 1 },
      include: withImages,
    });
    bust(project.slug);
    return project;
  },

  async update(id: string, input: ProjectUpdateInput) {
    const old = await getOrThrow(id);
    const project = await prisma.project.update({
      where: { id },
      data: clean(input),
      include: withImages,
    });
    await replaceAsset(old.coverPublicId, project.coverPublicId);
    bust(old.slug, project.slug);
    return project;
  },

  async remove(id: string) {
    const project = await getOrThrow(id);
    await prisma.project.delete({ where: { id } });
    await Promise.all([
      destroyAsset(project.coverPublicId),
      ...project.images.map((img) => destroyAsset(img.publicId)),
    ]);
    bust(project.slug);
  },

  async reorder({ items }: ReorderInput) {
    await prisma.$transaction(
      items.map((i) => prisma.project.update({ where: { id: i.id }, data: { order: i.order } })),
    );
    bust();
  },

  async addImage(projectId: string, input: ProjectImageInput) {
    const project = await getOrThrow(projectId);
    const max = await prisma.projectImage.aggregate({ where: { projectId }, _max: { order: true } });
    const image = await prisma.projectImage.create({
      data: { ...input, projectId, order: (max._max.order ?? -1) + 1 },
    });
    bust(project.slug);
    return image;
  },

  async updateImageAlt(projectId: string, imageId: string, alt: string | null) {
    const project = await getOrThrow(projectId);
    const image = await prisma.projectImage.update({
      where: { id: imageId, projectId },
      data: { alt },
    });
    bust(project.slug);
    return image;
  },

  async removeImage(projectId: string, imageId: string) {
    const project = await getOrThrow(projectId);
    const image = await prisma.projectImage.delete({ where: { id: imageId, projectId } });
    await destroyAsset(image.publicId);
    bust(project.slug);
  },

  async reorderImages(projectId: string, { items }: ReorderInput) {
    const project = await getOrThrow(projectId);
    await prisma.$transaction(
      items.map((i) =>
        prisma.projectImage.update({ where: { id: i.id, projectId }, data: { order: i.order } }),
      ),
    );
    bust(project.slug);
  },

  /** Public: only published projects are visible by slug. */
  async getPublishedBySlug(slug: string) {
    const project = await prisma.project.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: withImages,
    });
    if (!project) throw ApiError.notFound("Project not found");
    return project;
  },
};
