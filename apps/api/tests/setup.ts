import { beforeEach, vi } from "vitest";

// Must run before src/env.ts is imported by any test.
Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  JWT_ACCESS_SECRET: "test_access_secret_at_least_32_characters_long",
  JWT_REFRESH_SECRET: "test_refresh_secret_at_least_32_characters_lon",
  CLOUDINARY_CLOUD_NAME: "test",
  CLOUDINARY_API_KEY: "test",
  CLOUDINARY_API_SECRET: "test",
  ADMIN_EMAIL: "admin@test.dev",
  ADMIN_PASSWORD: "TestPassword-123",
  WEB_ORIGIN: "http://localhost:3000",
  REVALIDATE_SECRET: "test_revalidate_secret",
});

vi.mock("../src/lib/prisma", () => {
  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    upsert: vi.fn(),
  });
  return {
    prisma: {
      user: model(),
      skill: model(),
      project: model(),
      projectImage: model(),
      contactMessage: model(),
      profile: model(),
      $transaction: vi.fn(),
    },
  };
});

vi.mock("../src/lib/cloudinary", () => ({
  uploadBuffer: vi.fn(),
  destroyAsset: vi.fn(),
  replaceAsset: vi.fn(),
}));
vi.mock("../src/lib/revalidate", () => ({ revalidateWeb: vi.fn() }));
vi.mock("../src/lib/mailer", () => ({ notifyContact: vi.fn() }));

beforeEach(async () => {
  vi.clearAllMocks();
  const { prisma } = await import("../src/lib/prisma");
  vi.mocked(prisma.$transaction as (ops: unknown[]) => Promise<unknown[]>).mockImplementation(
    (ops: unknown[]) => Promise.all(ops),
  );
});
