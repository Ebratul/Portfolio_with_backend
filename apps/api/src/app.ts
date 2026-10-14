import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./env";
import { logger } from "./lib/logger";
import { originGuard } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiRoutes } from "./routes";

export function createApp(): Express {
  const app = express();
  // Number of proxies between the visitor and this process; needed for correct client IPs.
  app.set("trust proxy", env.TRUST_PROXY_HOPS);
  app.disable("x-powered-by");

  app.use(pinoHttp({ logger }));
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } } }));
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(originGuard);
  app.use("/api/v1", apiRoutes());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
