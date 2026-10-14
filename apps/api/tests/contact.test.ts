import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { notifyContact } from "../src/lib/mailer";
import { prisma } from "../src/lib/prisma";
import { api } from "./helpers";

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  subject: "Hello there",
  message: "I would love to work with you on a project.",
};

describe("POST /public/contact", () => {
  it("stores the message and notifies the owner", async () => {
    vi.mocked(prisma.contactMessage.create).mockResolvedValue({ id: "m1" } as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ email: "owner@test.dev" } as never);

    const res = await api().post("/api/v1/public/contact").send(valid);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { received: true } });
    expect(prisma.contactMessage.create).toHaveBeenCalledOnce();
    expect(notifyContact).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@test.dev" }));
  });

  it("silently drops honeypot submissions", async () => {
    const res = await api().post("/api/v1/public/contact").send({ ...valid, website: "http://spam.io" });
    expect(res.status).toBe(201);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
    expect(notifyContact).not.toHaveBeenCalled();
  });

  it("validates input", async () => {
    const res = await api().post("/api/v1/public/contact").send({ ...valid, email: "nope", message: "short" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details.fieldErrors)).toEqual(
      expect.arrayContaining(["email", "message"]),
    );
  });

  it("allows 5 messages per IP per hour, then returns 429", async () => {
    vi.mocked(prisma.contactMessage.create).mockResolvedValue({ id: "m" } as never);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    const agent = request(createApp());
    for (let i = 0; i < 5; i++) {
      expect((await agent.post("/api/v1/public/contact").send(valid)).status).toBe(201);
    }
    const blocked = await agent.post("/api/v1/public/contact").send(valid);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });
});
