import { env } from "../env";
import { logger } from "./logger";

/**
 * Tells the Next.js site to purge cached data for the given tags.
 * Fire-and-forget: the admin mutation has already succeeded, so a failure is only logged.
 */
export function revalidateWeb(tags: string[]): void {
  void (async () => {
    try {
      const res = await fetch(`${env.WEB_ORIGIN}/api/revalidate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret: env.REVALIDATE_SECRET, tags }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) logger.warn({ status: res.status, tags }, "Revalidation rejected");
    } catch (err) {
      logger.warn({ err, tags }, "Revalidation request failed");
    }
  })();
}
