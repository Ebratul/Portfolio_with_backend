import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { MulterError } from "multer";
import { ZodError } from "zod";
import type { ApiResponse } from "@portfolio/shared";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
};

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof ZodError) {
    return ApiError.validation("Invalid request", err.flatten());
  }
  if (err instanceof MulterError) {
    return err.code === "LIMIT_FILE_SIZE"
      ? ApiError.upload("File is too large", 413)
      : ApiError.upload(err.message);
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return ApiError.notFound();
    if (err.code === "P2002") {
      // meta.target lists the unique column(s), e.g. ["slug"]; naming them tells the user what to change.
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target.map(String).join(", ") : typeof target === "string" ? target : "";
      return ApiError.conflict(fields ? `A record with this ${fields} already exists` : "A record with this value already exists");
    }
  }
  if (err instanceof SyntaxError && "body" in err) return ApiError.validation("Malformed JSON body");
  return new ApiError(500, "INTERNAL", "Something went wrong");
}

// Express identifies error handlers by their 4-argument arity, so `_next` must stay.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const apiError = toApiError(err);
  if (apiError.status >= 500) logger.error({ err, path: req.path }, "Unhandled error");
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details !== undefined ? { details: apiError.details } : {}),
    },
  };
  res.status(apiError.status).json(body);
};
