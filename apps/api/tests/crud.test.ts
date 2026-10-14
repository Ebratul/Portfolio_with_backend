import { describe, expect, it, vi } from "vitest";
import { destroyAsset } from "../src/lib/cloudinary";
import { prisma } from "../src/lib/prisma";
import { revalidateWeb } from "../src/lib/revalidate";
import { adminCookie, api } from "./helpers";

const validSkill = {
  name: "TypeScript",
  category: "LANGUAGES",
  level: "PRO",
  percentage: 90,
  icon: "SiTypescript",
};

describe("admin skills CRUD", () => {
  it("rejects unauthenticated writes", async () => {
    const res = await api().post("/api/v1/admin/skills").send(validSkill);
    expect(res.status).toBe(401);
    expect(prisma.skill.create).not.toHaveBeenCalled();
  });

  it("creates a skill at the end of its category and revalidates the site", async () => {
    vi.mocked(prisma.skill.aggregate).mockResolvedValue({ _max: { order: 4 } } as never);
    vi.mocked(prisma.skill.create).mockResolvedValue({ id: "s1", ...validSkill, order: 5 } as never);

    const res = await api().post("/api/v1/admin/skills").set("Cookie", adminCookie()).send(validSkill);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, data: { id: "s1", order: 5 } });
    expect(vi.mocked(prisma.skill.create).mock.calls[0]?.[0].data.order).toBe(5);
    expect(revalidateWeb).toHaveBeenCalledWith(["home"]);
  });

  it("returns field-level validation errors", async () => {
    const res = await api()
      .post("/api/v1/admin/skills")
      .set("Cookie", adminCookie())
      .send({ ...validSkill, percentage: 150, category: "NOPE" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(res.body.error.details.fieldErrors)).toEqual(
      expect.arrayContaining(["percentage", "category"]),
    );
  });

  it("routes PATCH /reorder to reorder, not to /:id", async () => {
    vi.mocked(prisma.skill.update).mockResolvedValue({} as never);
    const res = await api()
      .patch("/api/v1/admin/skills/reorder")
      .set("Cookie", adminCookie())
      .send({ items: [{ id: "a", order: 1 }, { id: "b", order: 0 }] });
    expect(res.status).toBe(200);
    expect(prisma.skill.update).toHaveBeenCalledTimes(2);
  });

  it("maps a missing record to 404", async () => {
    const { Prisma } = await import("@prisma/client");
    vi.mocked(prisma.skill.delete).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("missing", { code: "P2025", clientVersion: "test" }),
    );
    const res = await api().delete("/api/v1/admin/skills/nope").set("Cookie", adminCookie());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("admin projects", () => {
  const project = {
    id: "p1",
    slug: "demo",
    coverPublicId: "portfolio/projects/cover",
    images: [
      { id: "i1", publicId: "portfolio/projects/a" },
      { id: "i2", publicId: "portfolio/projects/b" },
    ],
  };

  it("deletes the cover and every gallery image from Cloudinary", async () => {
    vi.mocked(prisma.project.findUnique).mockResolvedValue(project as never);
    vi.mocked(prisma.project.delete).mockResolvedValue(project as never);

    const res = await api().delete("/api/v1/admin/projects/p1").set("Cookie", adminCookie());

    expect(res.status).toBe(200);
    expect(destroyAsset).toHaveBeenCalledTimes(3);
    expect(destroyAsset).toHaveBeenCalledWith("portfolio/projects/cover");
    expect(revalidateWeb).toHaveBeenCalledWith(expect.arrayContaining(["home", "projects", "project:demo"]));
  });

  it("sanitizes rich-text description before saving", async () => {
    vi.mocked(prisma.project.aggregate).mockResolvedValue({ _max: { order: null } } as never);
    vi.mocked(prisma.project.create).mockResolvedValue({ ...project, images: [] } as never);

    await api()
      .post("/api/v1/admin/projects")
      .set("Cookie", adminCookie())
      .send({
        slug: "demo",
        title: "Demo",
        subtitle: "Sub",
        summary: "Summary",
        description: '<p onclick="x()">Hi</p><script>alert(1)</script>',
        coverUrl: "https://res.cloudinary.com/x/image/upload/c.png",
        coverPublicId: "portfolio/projects/c",
      });

    const saved = vi.mocked(prisma.project.create).mock.calls[0]?.[0].data.description;
    expect(saved).toBe("<p>Hi</p>");
  });

  it("only exposes published projects publicly", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);
    const res = await api().get("/api/v1/public/projects/draft-one");
    expect(res.status).toBe(404);
    expect(vi.mocked(prisma.project.findFirst).mock.calls[0]?.[0]?.where).toMatchObject({
      status: "PUBLISHED",
    });
  });
});
