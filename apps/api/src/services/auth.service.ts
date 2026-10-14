import bcrypt from "bcryptjs";
import type { AuthUser, ChangePasswordInput, LoginInput } from "@portfolio/shared";
import { ApiError } from "../lib/errors";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { prisma } from "../lib/prisma";

export interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const BCRYPT_ROUNDS = 12;
/** Compared against when the email is unknown so response time does not reveal valid emails. */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const toAuthUser = (u: { id: string; email: string }): AuthUser => ({
  id: u.id,
  email: u.email,
  role: "ADMIN",
});

async function startSession(user: { id: string; email: string }): Promise<Session> {
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: hashToken(refreshToken) },
  });
  return { user: toAuthUser(user), accessToken, refreshToken };
}

export const authService = {
  async login({ email, password }: LoginInput): Promise<Session> {
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw ApiError.unauthorized("Invalid email or password");
    return startSession(user);
  },

  /** Rotates the refresh token; a reused (stolen) token no longer matches and ends the session. */
  async refresh(token: string): Promise<Session> {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshToken || user.refreshToken !== hashToken(token)) {
      if (user) await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      throw ApiError.unauthorized("Session expired");
    }
    return startSession(user);
  },

  async logout(userId: string): Promise<void> {
    await prisma.user.updateMany({ where: { id: userId }, data: { refreshToken: null } });
  },

  async me(userId: string): Promise<AuthUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.unauthorized();
    return toAuthUser(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<Session> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.unauthorized();
    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw ApiError.validation("Current password is incorrect", {
        fieldErrors: { currentPassword: ["Current password is incorrect"] },
      });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS) },
    });
    return startSession(user);
  },
};
