import type { CookieOptions, Response } from "express";
import { env } from "../env";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from "./jwt";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const base: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export function setAuthCookies(res: Response, access: string, refresh: string): void {
  res.cookie(ACCESS_COOKIE, access, { ...base, maxAge: ACCESS_TTL_SECONDS * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_TTL_SECONDS * 1000 });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}
