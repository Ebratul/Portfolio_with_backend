import { z } from "zod";

/** Server-only variables. Never import this file from a client component. */
const serverSchema = z.object({
  API_INTERNAL_URL: z.string().url(),
  REVALIDATE_SECRET: z.string().min(16),
});

/** Variables inlined into the client bundle; must be prefixed NEXT_PUBLIC_. */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
});

const isServer = typeof window === "undefined";

const client = clientSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
});

const server = isServer ? serverSchema.parse(process.env) : ({} as z.infer<typeof serverSchema>);

export const env = { ...client, ...server };
