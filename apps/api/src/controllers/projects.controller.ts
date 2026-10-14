import type { RequestHandler } from "express";
import {
  idParamSchema,
  projectImageInputSchema,
  projectImageUpdateSchema,
  projectInputSchema,
  projectListQuerySchema,
  projectUpdateSchema,
  reorderSchema,
  slugParamSchema,
} from "@portfolio/shared";
import { z } from "zod";
import { ok, parse } from "../lib/http";
import { projectsService } from "../services/projects.service";

const idOf = (params: unknown): string => parse(idParamSchema, params).id;
const imageParams = z.object({ id: z.string().min(1), imageId: z.string().min(1) });

export const projectsController = {
  list: (async (req, res) => {
    ok(res, await projectsService.list(parse(projectListQuerySchema, req.query)));
  }) satisfies RequestHandler,
  get: (async (req, res) => {
    ok(res, await projectsService.getById(idOf(req.params)));
  }) satisfies RequestHandler,
  create: (async (req, res) => {
    ok(res, await projectsService.create(parse(projectInputSchema, req.body)), 201);
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await projectsService.update(idOf(req.params), parse(projectUpdateSchema, req.body)));
  }) satisfies RequestHandler,
  remove: (async (req, res) => {
    await projectsService.remove(idOf(req.params));
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  reorder: (async (req, res) => {
    await projectsService.reorder(parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,

  addImage: (async (req, res) => {
    ok(res, await projectsService.addImage(idOf(req.params), parse(projectImageInputSchema, req.body)), 201);
  }) satisfies RequestHandler,
  updateImage: (async (req, res) => {
    const { id, imageId } = parse(imageParams, req.params);
    const { alt } = parse(projectImageUpdateSchema, req.body);
    ok(res, await projectsService.updateImageAlt(id, imageId, alt));
  }) satisfies RequestHandler,
  removeImage: (async (req, res) => {
    const { id, imageId } = parse(imageParams, req.params);
    await projectsService.removeImage(id, imageId);
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  reorderImages: (async (req, res) => {
    await projectsService.reorderImages(idOf(req.params), parse(reorderSchema, req.body));
    ok(res, { reordered: true });
  }) satisfies RequestHandler,

  // Public
  listPublished: (async (req, res) => {
    const { tech, search } = parse(projectListQuerySchema, req.query);
    ok(res, await projectsService.list({ status: "PUBLISHED", tech, search }));
  }) satisfies RequestHandler,
  getPublished: (async (req, res) => {
    ok(res, await projectsService.getPublishedBySlug(parse(slugParamSchema, req.params).slug));
  }) satisfies RequestHandler,
};
