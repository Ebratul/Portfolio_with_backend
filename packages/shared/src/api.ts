import { z } from "zod";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiErrorBody };

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "UPLOAD_INVALID",
  "INTERNAL",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const idParamSchema = z.object({ id: z.string().min(1) });
export const slugParamSchema = z.object({ slug: z.string().min(1) });

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), order: z.number().int().min(0) })).min(1),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const uploadResultSchema = z.object({
  url: z.string().url(),
  publicId: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});
export type UploadResult = z.infer<typeof uploadResultSchema>;
