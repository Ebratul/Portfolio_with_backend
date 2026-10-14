import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request, Response } from "express";
import { ApiError } from "../lib/errors";

function limiter(windowMs: number, limit: number, message: string, skipSuccess = false): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: skipSuccess,
    handler: (_req: Request, _res: Response, next) => {
      next(new ApiError(429, "RATE_LIMITED", message));
    },
  });
}

/** 5 failed attempts per 15 minutes per IP. */
export const loginLimiter = (): RateLimitRequestHandler =>
  limiter(15 * 60 * 1000, 5, "Too many login attempts. Try again in 15 minutes.", true);

/** 5 messages per hour per IP. */
export const contactLimiter = (): RateLimitRequestHandler =>
  limiter(60 * 60 * 1000, 5, "Too many messages. Please try again later.");

/**
 * Generous cap on the admin API (only the owner uses it). There is deliberately no global limiter:
 * the Next.js server calls this API for SSR and middleware from a single IP, so a per-IP global
 * limit would throttle the whole public site. Public GETs are cached by Next instead.
 */
export const adminLimiter = (): RateLimitRequestHandler =>
  limiter(60 * 1000, 600, "Too many requests. Slow down.");
