import { z } from "zod";
import { skillCategorySchema, skillLevelSchema, type SkillCategory } from "../enums";

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  category: skillCategorySchema,
  level: skillLevelSchema,
  percentage: z.number().int().min(0).max(100),
  icon: z.string().trim().min(1).max(80),
  iconColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex color")
    .nullish()
    .or(z.literal("").transform(() => null)),
  isVisible: z.boolean().default(true),
});
export type SkillInput = z.infer<typeof skillInputSchema>;
export type Skill = SkillInput & { id: string; order: number };
export type GroupedSkills = Record<SkillCategory, Skill[]>;
