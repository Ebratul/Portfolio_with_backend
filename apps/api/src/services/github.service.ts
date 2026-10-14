import { z } from "zod";
import type { GithubActivity, GithubDay } from "@portfolio/shared";
import { env } from "../env";
import { ApiError } from "../lib/errors";
import { logger } from "../lib/logger";
import { prisma } from "../lib/prisma";

const TTL_MS = 6 * 60 * 60 * 1000;

const LEVELS: Record<string, GithubDay["level"]> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const responseSchema = z.object({
  data: z
    .object({
      user: z
        .object({
          contributionsCollection: z.object({
            contributionCalendar: z.object({
              totalContributions: z.number(),
              weeks: z.array(
                z.object({
                  contributionDays: z.array(
                    z.object({
                      date: z.string(),
                      contributionCount: z.number(),
                      contributionLevel: z.string(),
                    }),
                  ),
                }),
              ),
            }),
          }),
        })
        .nullable(),
    })
    .nullable(),
});

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

let cache: { username: string; at: number; value: GithubActivity } | null = null;

export const githubService = {
  /** Server-side only: the token never reaches the browser. Cached for 6 hours. */
  async activity(): Promise<GithubActivity> {
    const profile = await prisma.profile.findUnique({ where: { id: "singleton" } });
    const username = profile?.githubUsername;
    if (!username || !env.GITHUB_TOKEN) throw ApiError.notFound("GitHub activity is not configured");

    if (cache?.username === username && Date.now() - cache.at < TTL_MS) return cache.value;

    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { login: username } }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "GitHub GraphQL request failed");
      if (cache?.username === username) return cache.value; // serve stale data over an error
      throw new ApiError(502, "INTERNAL", "Could not load GitHub activity");
    }

    const calendar = responseSchema.parse(await res.json()).data?.user?.contributionsCollection
      .contributionCalendar;
    if (!calendar) throw ApiError.notFound("GitHub user not found");

    const value: GithubActivity = {
      username,
      total: calendar.totalContributions,
      weeks: calendar.weeks.map((w) => ({
        days: w.contributionDays.map((d) => ({
          date: d.date,
          count: d.contributionCount,
          level: LEVELS[d.contributionLevel] ?? 0,
        })),
      })),
    };
    cache = { username, at: Date.now(), value };
    return value;
  },
};
