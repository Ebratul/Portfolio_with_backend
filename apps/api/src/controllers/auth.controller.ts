import type { RequestHandler } from "express";
import { changePasswordSchema, loginSchema } from "@portfolio/shared";
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "../lib/cookies";
import { ApiError } from "../lib/errors";
import { ok, parse } from "../lib/http";
import { verifyRefreshToken } from "../lib/jwt";
import { authService, type Session } from "../services/auth.service";

function respond(res: Parameters<RequestHandler>[1], session: Session): void {
  setAuthCookies(res, session.accessToken, session.refreshToken);
  ok(res, { user: session.user });
}

export const authController = {
  login: (async (req, res) => {
    respond(res, await authService.login(parse(loginSchema, req.body)));
  }) satisfies RequestHandler,

  refresh: (async (req, res) => {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[REFRESH_COOKIE];
    if (!token) throw ApiError.unauthorized("No refresh token");
    try {
      respond(res, await authService.refresh(token));
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }) satisfies RequestHandler,

  /** Works with an expired access token: identity comes from the refresh cookie when valid. */
  logout: (async (req, res) => {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[REFRESH_COOKIE];
    if (token) {
      try {
        await authService.logout(verifyRefreshToken(token).sub);
      } catch {
        // Token already invalid: nothing to revoke server-side.
      }
    }
    clearAuthCookies(res);
    ok(res, { loggedOut: true });
  }) satisfies RequestHandler,

  me: (async (req, res) => {
    ok(res, { user: await authService.me(req.auth?.userId ?? "") });
  }) satisfies RequestHandler,

  changePassword: (async (req, res) => {
    const input = parse(changePasswordSchema, req.body);
    respond(res, await authService.changePassword(req.auth?.userId ?? "", input));
  }) satisfies RequestHandler,
};
