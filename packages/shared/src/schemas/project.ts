import { z } from "zod";
import { httpUrl } from "../urls";
import { projectStatusSchema, type ProjectStatus } from "../enums";

const emptyToNull = <T extends z.ZodTypeAny>(s: T) =>
  z.union([z.literal("").transform(() => null), s]).nullish();
const slug = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

export const projectInputSchema = z.object({
  slug,
  title: z.string().trim().min(1).max(120),
  subtitle: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(400),
  description: z.string().min(1),
  features: z.array(z.string().trim().min(1)).default([]),
  architecture: emptyToNull(z.string()),
  techStack: z.array(z.string().trim().min(1)).default([]),
  role: emptyToNull(z.string().trim().max(120)),
  coverUrl: httpUrl,
  coverPublicId: z.string().min(1),
  liveUrl: emptyToNull(httpUrl),
  githubUrl: emptyToNull(httpUrl),
  githubServerUrl: emptyToNull(httpUrl),
  isFeatured: z.boolean().default(false),
  status: projectStatusSchema.default("DRAFT"),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;
export const projectUpdateSchema = projectInputSchema.partial();
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const projectImageInputSchema = z.object({
  url: httpUrl,
  publicId: z.string().min(1),
  alt: z.string().trim().max(200).nullish(),
});
export type ProjectImageInput = z.infer<typeof projectImageInputSchema>;
export const projectImageUpdateSchema = z.object({ alt: z.string().trim().max(200).nullable() });

export interface ProjectImage extends ProjectImageInput {
  id: string;
  order: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  features: string[];
  architecture: string | null;
  techStack: string[];
  role: string | null;
  coverUrl: string;
  coverPublicId: string;
  images: ProjectImage[];
  liveUrl: string | null;
  githubUrl: string | null;
  githubServerUrl: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
  order: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export const projectListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: projectStatusSchema.optional(),
  tech: z.string().trim().optional(),
});
