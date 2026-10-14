import "server-only";
import type {
  ApiResponse,
  GithubActivity,
  HomePayload,
  Project,
} from "@portfolio/shared";
import { CACHE_TAGS } from "@portfolio/shared";
import { env } from "../../env";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface FetchOptions {
  tags: string[];
  /** Safety net: data is also purged on demand through /api/revalidate. */
  revalidate?: number;
}

async function apiGet<T>(path: string, { tags, revalidate = 3600 }: FetchOptions): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.API_INTERNAL_URL}/api/v1${path}`, { next: { tags, revalidate } });
  } catch {
    throw new ApiRequestError(503, "UNREACHABLE", "The API is not reachable");
  }
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) throw new ApiRequestError(res.status, "BAD_RESPONSE", "Unexpected API response");
  if (!body.success) throw new ApiRequestError(res.status, body.error.code, body.error.message);
  return body.data;
}

export const getHome = (): Promise<HomePayload> =>
  apiGet<HomePayload>("/public/home", { tags: [CACHE_TAGS.home] });

export const getProjects = (): Promise<Project[]> =>
  apiGet<Project[]>("/public/projects", { tags: [CACHE_TAGS.projects] });

export const getProject = (slug: string): Promise<Project> =>
  apiGet<Project>(`/public/projects/${encodeURIComponent(slug)}`, {
    tags: [CACHE_TAGS.projects, CACHE_TAGS.project(slug)],
  });

/** Returns null when GitHub activity is not configured or unavailable. */
export async function getGithubActivity(): Promise<GithubActivity | null> {
  try {
    return await apiGet<GithubActivity>("/public/github-activity", {
      tags: [CACHE_TAGS.github],
      revalidate: 6 * 3600,
    });
  } catch {
    return null;
  }
}
