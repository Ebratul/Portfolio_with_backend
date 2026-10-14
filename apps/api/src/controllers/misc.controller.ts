import type { RequestHandler } from "express";
import {
  contactInputSchema,
  idParamSchema,
  messageBulkSchema,
  messageListQuerySchema,
  messageUpdateSchema,
  uploadFolderSchema,
} from "@portfolio/shared";
import { z } from "zod";
import { ok, parse } from "../lib/http";
import { githubService } from "../services/github.service";
import { messagesService } from "../services/messages.service";
import { publicService } from "../services/public.service";
import { statsService } from "../services/stats.service";
import { uploadService } from "../services/upload.service";

const idOf = (params: unknown): string => parse(idParamSchema, params).id;

export const publicController = {
  home: (async (_req, res) => {
    ok(res, await publicService.home());
  }) satisfies RequestHandler,
  github: (async (_req, res) => {
    ok(res, await githubService.activity());
  }) satisfies RequestHandler,
  contact: (async (req, res) => {
    const input = parse(contactInputSchema, req.body);
    // Honeypot: pretend success so bots get no signal, but store nothing.
    if (input.website) {
      ok(res, { received: true }, 201);
      return;
    }
    await messagesService.submit(input, req.ip);
    ok(res, { received: true }, 201);
  }) satisfies RequestHandler,
};

export const messagesController = {
  list: (async (req, res) => {
    ok(res, await messagesService.list(parse(messageListQuerySchema, req.query)));
  }) satisfies RequestHandler,
  update: (async (req, res) => {
    ok(res, await messagesService.setRead(idOf(req.params), parse(messageUpdateSchema, req.body).isRead));
  }) satisfies RequestHandler,
  remove: (async (req, res) => {
    await messagesService.remove(idOf(req.params));
    ok(res, { deleted: true });
  }) satisfies RequestHandler,
  bulk: (async (req, res) => {
    const { ids, action } = parse(messageBulkSchema, req.body);
    ok(res, await messagesService.bulk(ids, action));
  }) satisfies RequestHandler,
};

export const statsController = {
  get: (async (_req, res) => {
    ok(res, await statsService.get());
  }) satisfies RequestHandler,
};

export const uploadController = {
  upload: (async (req, res) => {
    const { folder } = parse(z.object({ folder: uploadFolderSchema }), req.body);
    ok(res, await uploadService.upload(req.file?.buffer, folder), 201);
  }) satisfies RequestHandler,
};
