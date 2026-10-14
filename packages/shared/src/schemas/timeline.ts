import { z } from "zod";
import { httpUrl } from "../urls";
import { timelineTypeSchema, type TimelineType } from "../enums";

export const timelineBaseSchema = z.object({
    type: timelineTypeSchema,
    title: z.string().trim().min(1).max(160),
    organization: z.string().trim().min(1).max(160),
    location: z.string().trim().max(120).nullish(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullish(),
    description: z.string().trim().min(1).max(2000),
    tags: z.array(z.string().trim().min(1)).default([]),
    credentialUrl: httpUrl.nullish().or(z.literal("").transform(() => null)),
    imageUrl: httpUrl.nullish(),
    imagePublicId: z.string().nullish(),
  isVisible: z.boolean().default(true),
});

export const timelineInputSchema = timelineBaseSchema.refine(
  (v) => !v.endDate || v.endDate >= v.startDate,
  { path: ["endDate"], message: "End date must be after start date" },
);
export const timelineUpdateSchema = timelineBaseSchema.partial();
export type TimelineInput = z.infer<typeof timelineInputSchema>;

export interface TimelineItem {
  id: string;
  type: TimelineType;
  title: string;
  organization: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string;
  tags: string[];
  credentialUrl: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  order: number;
  isVisible: boolean;
}
export type GroupedTimeline = Record<TimelineType, TimelineItem[]>;
