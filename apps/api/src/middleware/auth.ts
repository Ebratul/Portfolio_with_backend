import type { RequestHandler } from "express";
import { env } from "../env";
import { ACCESS_COOKIE } from "../lib/cookies";
import { ApiError } from "../lib/errors";
import { verifyAccessToken } from "../lib/jwt";

export const requireAdmin: RequestHandler = (req, _res, next) => {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.[ACCESS_COOKIE];
  if (!token) throw ApiError.unauthorized();
  req.auth = { userId: verifyAccessToken(token).sub };
  next();
};

/**
 * Defence in depth on top of sameSite=strict cookies: a state-changing request that
 * carries an Origin header must come from the configured web origin.
 */
export const originGuard: RequestHandler = (req, _res, next) => {
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.get("origin");
  if (unsafe && origin && origin !== env.WEB_ORIGIN) throw ApiError.forbidden("Origin not allowed");
  next();
};
