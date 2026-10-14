import { CACHE_TAGS, type ProfileInput, type SiteSettingsInput } from "@portfolio/shared";
import { replaceAsset } from "../lib/cloudinary";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { revalidateWeb } from "../lib/revalidate";

const SINGLETON = "singleton";

export const profileService = {
  async get() {
    const profile = await prisma.profile.findUnique({ where: { id: SINGLETON } });
    if (!profile) throw ApiError.notFound("Profile not set up. Run `pnpm db:seed`.");
    return profile;
  },

  async update(input: ProfileInput) {
    const old = await prisma.profile.findUnique({ where: { id: SINGLETON } });
    const profile = await prisma.profile.upsert({
      where: { id: SINGLETON },
      create: { id: SINGLETON, ...input },
      update: input,
    });
    await Promise.all([
      replaceAsset(old?.avatarPublicId, profile.avatarPublicId),
      replaceAsset(old?.aboutImagePublicId, profile.aboutImagePublicId),
      replaceAsset(old?.resumePublicId, profile.resumePublicId),
    ]);
    revalidateWeb([CACHE_TAGS.home, CACHE_TAGS.github]);
    return profile;
  },
};

export const settingsService = {
  async get() {
    const settings = await prisma.siteSettings.findUnique({ where: { id: SINGLETON } });
    if (!settings) throw ApiError.notFound("Settings not set up. Run `pnpm db:seed`.");
    return settings;
  },

  async update(input: SiteSettingsInput) {
    const old = await prisma.siteSettings.findUnique({ where: { id: SINGLETON } });
    const settings = await prisma.siteSettings.upsert({
      where: { id: SINGLETON },
      create: { id: SINGLETON, ...input },
      update: input,
    });
    await replaceAsset(old?.ogImagePublicId, settings.ogImagePublicId);
    revalidateWeb([CACHE_TAGS.home]);
    return settings;
  },
};
