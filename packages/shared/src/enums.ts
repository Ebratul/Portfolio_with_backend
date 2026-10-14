import { z } from "zod";

export const SKILL_CATEGORIES = ["LANGUAGES", "FRONTEND", "BACKEND", "DATABASE", "TOOLS"] as const;
export const SKILL_LEVELS = ["LEARNING", "INTERMEDIATE", "PRO"] as const;
export const PROJECT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export const TIMELINE_TYPES = ["EXPERIENCE", "EDUCATION", "CERTIFICATE"] as const;
export const SECTION_KEYS = [
  "hero",
  "about",
  "skills",
  "projects",
  "journey",
  "contact",
  "activity",
] as const;
export const UPLOAD_FOLDERS = ["avatar", "projects", "certificates", "resume", "og"] as const;

export const skillCategorySchema = z.enum(SKILL_CATEGORIES);
export const skillLevelSchema = z.enum(SKILL_LEVELS);
export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export const timelineTypeSchema = z.enum(TIMELINE_TYPES);
export const sectionKeySchema = z.enum(SECTION_KEYS);
export const uploadFolderSchema = z.enum(UPLOAD_FOLDERS);

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type SkillLevel = z.infer<typeof skillLevelSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type TimelineType = z.infer<typeof timelineTypeSchema>;
export type SectionKey = z.infer<typeof sectionKeySchema>;
export type UploadFolder = z.infer<typeof uploadFolderSchema>;

export const FONT_OPTIONS = [
  "Inter",
  "Outfit",
  "Poppins",
  "Space Grotesk",
  "DM Sans",
  "Manrope",
  "Plus Jakarta Sans",
  "Sora",
] as const;

export const UPLOAD_LIMITS = {
  imageMaxBytes: 5 * 1024 * 1024,
  pdfMaxBytes: 10 * 1024 * 1024,
} as const;
