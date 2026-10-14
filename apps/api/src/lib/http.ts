import type { Response } from "express";
import type { z } from "zod";

/** Sends the standard success envelope. */
export function ok(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

/** Parses untrusted input; a ZodError is turned into a 400 by the error handler. */
export function parse<S extends z.ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  return schema.parse(input) as z.output<S>;
}
