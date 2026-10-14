import bcrypt from "bcryptjs";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { hashToken, signRefreshToken } from "../src/lib/jwt";
import { prisma } from "../src/lib/prisma";
import { ORIGIN, adminCookie, api } from "./helpers";

const user = {
  id: "user_1",
  email: "admin@test.dev",
  passwordHash: bcrypt.hashSync("Password123!", 4),
  role: "ADMIN",
  refreshToken: null,
};

describe("POST /auth/login", () => {
  it("sets httpOnly strict cookies and never leaks secrets", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
    vi.mocked(prisma.user.update).mockResolvedValue(user as never);

    const res = await api()
      .post("/api/v1/auth/login")
      .send({ email: "ADMIN@test.dev", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { user: { id: "user_1", email: "admin@test.dev", role: "ADMIN" } },
    });
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies).toHaveLength(2);
    for (const c of cookies) {
      expect(c).toMatch(/HttpOnly/i);
      expect(c).toMatch(/SameSite=Strict/i);
    }
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|refreshToken/);
    // The stored refresh token must be a hash, not the raw JWT.
    const stored = vi.mocked(prisma.user.update).mock.calls[0]?.[0].data.refreshToken;
    expect(stored).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a wrong password with 401", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
    const res = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@test.dev", password: "wrong" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects an unknown email with the same 401", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res = await api()
      .post("/api/v1/auth/login")
      .send({ email: "nobody@test.dev", password: "Password123!" });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  it("validates the body", async () => {
    const res = await api().post("/api/v1/auth/login").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rate-limits repeated failures (5 per window)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const agent = request(createApp());
    const attempt = () =>
      agent.post("/api/v1/auth/login").send({ email: "x@test.dev", password: "bad" });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });

  it("blocks state-changing requests from a foreign origin", async () => {
    const res = await api()
      .post("/api/v1/auth/login")
      .set("Origin", "https://evil.example")
      .send({ email: "admin@test.dev", password: "Password123!" });
    expect(res.status).toBe(403);
  });
});

describe("GET /auth/me", () => {
  it("requires a valid access token", async () => {
    expect((await api().get("/api/v1/auth/me")).status).toBe(401);
    const bad = await api().get("/api/v1/auth/me").set("Cookie", "access_token=garbage");
    expect(bad.status).toBe(401);
  });

  it("returns the current user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as never);
    const res = await api().get("/api/v1/auth/me").set("Cookie", adminCookie());
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("admin@test.dev");
  });
});

describe("POST /auth/refresh", () => {
  it("rotates a valid refresh token", async () => {
    const token = signRefreshToken("user_1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      refreshToken: hashToken(token),
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue(user as never);

    const res = await api()
      .post("/api/v1/auth/refresh")
      .set("Origin", ORIGIN)
      .set("Cookie", `refresh_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("revokes the session when an old (reused) token is presented", async () => {
    const token = signRefreshToken("user_1");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      refreshToken: hashToken("a-newer-token"),
    } as never);
    vi.mocked(prisma.user.update).mockResolvedValue(user as never);

    const res = await api().post("/api/v1/auth/refresh").set("Cookie", `refresh_token=${token}`);
    expect(res.status).toBe(401);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { refreshToken: null },
    });
  });

  it("returns 401 without a cookie", async () => {
    expect((await api().post("/api/v1/auth/refresh")).status).toBe(401);
  });
});
