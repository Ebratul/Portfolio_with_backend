import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../env";
import { ApiError } from "./errors";

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

const payloadSchema = z.object({ sub: z.string().min(1), role: z.literal("ADMIN") });
export type TokenPayload = z.infer<typeof payloadSchema>;

export function signAccessToken(userId: string): string {
  return jwt.sign({ role: "ADMIN" }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: ACCESS_TTL_SECONDS,
  });
}

export function signRefreshToken(userId: string): string {
  // jti makes every refresh token unique even when issued within the same second.
  return jwt.sign({ role: "ADMIN" }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: REFRESH_TTL_SECONDS,
    jwtid: crypto.randomUUID(),
  });
}

function verify(token: string, secret: string): TokenPayload {
  try {
    return payloadSchema.parse(jwt.verify(token, secret));
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

export const verifyAccessToken = (token: string): TokenPayload =>
  verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token: string): TokenPayload =>
  verify(token, env.JWT_REFRESH_SECRET);

/** Refresh tokens are stored hashed so a database leak cannot be replayed. */
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");
