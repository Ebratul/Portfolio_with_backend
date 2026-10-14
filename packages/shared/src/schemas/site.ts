import { z } from "zod";
import { httpUrl } from "../urls";
import { FONT_OPTIONS, sectionKeySchema, type SectionKey } from "../enums";

const hex = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a 6-digit hex color");

export const siteSettingsInputSchema = z.object({
  primaryColor: hex,
  accentColor: hex,
  bgColor: hex,
  surfaceColor: hex,
  defaultTheme: z.enum(["dark", "light", "system"]),
  fontHeading: z.enum(FONT_OPTIONS),
  fontBody: z.enum(FONT_OPTIONS),
  seoTitle: z.string().trim().min(1).max(70),
  seoDescription: z.string().trim().min(1).max(200),
  seoKeywords: z.array(z.string().trim().min(1)).default([]),
  ogImageUrl: httpUrl.nullish(),
  ogImagePublicId: z.string().nullish(),
  faviconUrl: httpUrl.nullish(),
  footerText: z.string().trim().min(1).max(240),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
export type SiteSettings = SiteSettingsInput & { id: string; updatedAt: string };

export const sectionConfigUpdateSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  subtitle: z.string().trim().max(240).nullish(),
  isVisible: z.boolean().optional(),
});
export type SectionConfigUpdate = z.infer<typeof sectionConfigUpdateSchema>;
export interface SectionConfig {
  id: string;
  key: SectionKey;
  title: string;
  subtitle: string | null;
  isVisible: boolean;
  order: number;
}
export { sectionKeySchema };

export const contactInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(5000),
  /** Honeypot: real users never fill this; the API silently drops submissions that do. */
  website: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

export const messageBulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["read", "unread", "delete"]),
});
export const messageUpdateSchema = z.object({ isRead: z.boolean() });
export const messageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  isRead: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  ip: string | null;
  createdAt: string;
}

export interface GithubDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}
export interface GithubActivity {
  username: string;
  total: number;
  weeks: { days: GithubDay[] }[];
}
