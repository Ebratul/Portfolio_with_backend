import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32, "Use at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "Use at least 32 characters"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  ADMIN_EMAIL: z.string().email(),
  /** Only read by `pnpm db:seed`. Remove it from the server after the first seed. */
  ADMIN_PASSWORD: z.string().min(10).optional(),
  GITHUB_TOKEN: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  /** HTTPS email API (https://resend.com). Preferred: some hosts (e.g. Render free) block outbound SMTP ports. */
  RESEND_API_KEY: z.string().optional(),
  /** Sender for Resend. Defaults to Resend's shared onboarding address (can only email your own Resend account address). */
  MAIL_FROM: z.string().optional(),
  WEB_ORIGIN: z.string().url(),
  REVALIDATE_SECRET: z.string().min(16),
  /** Reverse proxies in front of the API (Vercel rewrite -> Render = 2). Controls req.ip, and so rate limits. */
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
