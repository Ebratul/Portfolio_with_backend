import { z } from "zod";
import { httpUrl } from "../urls";

const optionalUrl = httpUrl.nullish().or(z.literal("").transform(() => null));
const strList = z.array(z.string().trim().min(1)).default([]);

export const profileInputSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  brandName: z.string().trim().min(1).max(60),
  brandSuffix: z.string().trim().max(20).default(".dev"),
  badgeText: z.string().trim().min(1).max(60),
  roles: z.array(z.string().trim().min(1)).min(1, "Add at least one role"),
  tagline: z.string().trim().min(1).max(240),
  shortBio: z.string().trim().min(1).max(600),
  aboutHeading: z.string().trim().min(1).max(240),
  aboutHighlights: strList,
  aboutParagraphs: z.array(z.string().trim().min(1)).min(1),
  avatarUrl: optionalUrl,
  avatarPublicId: z.string().nullish(),
  aboutImageUrl: optionalUrl,
  aboutImagePublicId: z.string().nullish(),
  experienceYears: z.number().min(0).max(80),
  isAvailable: z.boolean(),
  availabilityText: z.string().trim().min(1).max(40).default("Available"),
  resumeUrl: optionalUrl,
  resumePublicId: z.string().nullish(),
  location: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).nullish(),
  whatsapp: z.string().trim().max(40).nullish(),
  githubUsername: z
    .string()
    .trim()
    .regex(/^[a-zA-Z\d](?:[a-zA-Z\d-]{0,38})$/, "Invalid GitHub username")
    .nullish()
    .or(z.literal("").transform(() => null)),
});
export type ProfileInput = z.infer<typeof profileInputSchema>;
export type Profile = ProfileInput & { id: string; updatedAt: string };

export const valueCardInputSchema = z.object({
  title: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(60),
  description: z.string().trim().max(240).nullish(),
});
export type ValueCardInput = z.infer<typeof valueCardInputSchema>;
export type ValueCard = ValueCardInput & { id: string; order: number };

export const socialLinkInputSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  url: httpUrl,
  icon: z.string().trim().min(1).max(60),
  isVisible: z.boolean().default(true),
});
export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;
export type SocialLink = SocialLinkInput & { id: string; order: number };
