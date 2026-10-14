import type { RequestHandler } from "express";
import {
  idParamSchema,
  profileInputSchema,
  reorderSchema,
  sectionConfigUpdateSchema,
  siteSettingsInputSchema,
  skillInputSchema,
  socialLinkInputSchema,
  timelineInputSchema,
  timelineTypeSchema,
  timelineUpdateSchema,
  valueCardInputSchema,
} from "@portfolio/shared";
import { z } from "zod";
import { ok, parse } from "../lib/http";
import { profileService, settingsService } from "../services/profile.service";
import { sectionsService } from "../services/sections.service";
import { skillsService } from "../services/skills.service";
import { socialsService } from "../services/socials.service";
import { timelineService } from "../services/timeline.service";
import { valueCardsService } from "../services/valueCards.service";

const idOf = (params: unknown): string => parse(idParamSchema, params).id;

export const profileController = {
  get: (async (_req, res) => {
    ok(res, await profileService.get());
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await profileService.update(parse(profileInputSchema, req.body)));
  }) satisfies RequestHandler,
};

export const settingsController = {
  get: (async (_req, res) => {
    ok(res, await settingsService.get());
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await settingsService.update(parse(siteSettingsInputSchema, req.body)));
  }) satisfies RequestHandler,
};

export const skillsController = {
  list: (async (_req, res) => {
    ok(res, await skillsService.list());
  }) satisfies RequestHandler,
  create: (async (req, res) => {
    ok(res, await skillsService.create(parse(skillInputSchema, req.body)), 201);
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await skillsService.update(idOf(req.params), parse(skillInputSchema.partial(), req.body)));
  }) satisfies RequestHandler,
  remove: (async (req, res) => {
    await skillsService.remove(idOf(req.params));
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  reorder: (async (req, res) => {
    await skillsService.reorder(parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,
};

export const socialsController = {
  list: (async (_req, res) => {
    ok(res, await socialsService.list());
  }) satisfies RequestHandler,
  create: (async (req, res) => {
    ok(res, await socialsService.create(parse(socialLinkInputSchema, req.body)), 201);
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(
      res,
      await socialsService.update(idOf(req.params), parse(socialLinkInputSchema.partial(), req.body)),
    );
  }) satisfies RequestHandler,
  remove: (async (req, res) => {
    await socialsService.remove(idOf(req.params));
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  reorder: (async (req, res) => {
    await socialsService.reorder(parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,
};

export const valueCardsController = {
  list: (async (_req, res) => {
    ok(res, await valueCardsService.list());
  }) satisfies RequestHandler,
  create: (async (req, res) => {
    ok(res, await valueCardsService.create(parse(valueCardInputSchema, req.body)), 201);
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(
      res,
      await valueCardsService.update(idOf(req.params), parse(valueCardInputSchema.partial(), req.body)),
    );
  }) satisfies RequestHandler,
  remove: (async (req, res) => {
    await valueCardsService.remove(idOf(req.params));
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  reorder: (async (req, res) => {
    await valueCardsService.reorder(parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,
};

export const sectionsController = {
  list: (async (_req, res) => {
    ok(res, await sectionsService.list());
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await sectionsService.update(idOf(req.params), parse(sectionConfigUpdateSchema, req.body)));
  }) satisfies RequestHandler,
  reorder: (async (req, res) => {
    await sectionsService.reorder(parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,
};

export const timelineController = {
  list: (async (req, res) => {
    const { type } = parse(z.object({ type: timelineTypeSchema.optional() }), req.query);
    ok(res, await timelineService.list(type));
  }) satisfies RequestHandler,
  create: (async (req, res) => {
    ok(res, await timelineService.create(parse(timelineInputSchema, req.body)), 201);
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await timelineService.update(idOf(req.params), parse(timelineUpdateSchema, req.body)));
  }) satisfies RequestHandler,
  remove: (async (req, res) => {
    await timelineService.remove(idOf(req.params));
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  reorder: (async (req, res) => {
    await timelineService.reorder(parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,
};
