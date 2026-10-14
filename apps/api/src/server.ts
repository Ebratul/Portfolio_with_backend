import { createApp } from "./app";
import { env } from "./env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const server = createApp().listen(env.PORT, () => {
  logger.info(`API listening on :${env.PORT}`);
});

function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  shutdown("SIGINT");
});
