import type { ApiResponse } from "@portfolio/shared";

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "AdminApiError";
  }

  /** Field errors from a VALIDATION_ERROR response, keyed by field name. */
  get fieldErrors(): Record<string, string[] | undefined> {
    const d = this.details as { fieldErrors?: Record<string, string[] | undefined> } | undefined;
    return d?.fieldErrors ?? {};
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh call (tokens rotate on every use). */
function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch("/api/v1/auth/refresh", { method: "POST" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function toLogin(): void {
  if (!window.location.pathname.startsWith("/admin/login")) {
    window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
  }
}

export async function adminFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const isForm = init.body instanceof FormData;
  const send = (): Promise<Response> =>
    fetch(`/api/v1${path}`, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      ...(init.body === undefined
        ? {}
        : {
            body: isForm ? (init.body as FormData) : JSON.stringify(init.body),
            ...(isForm ? {} : { headers: { "content-type": "application/json" } }),
          }),
    });

  let res = await send();
  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (await refreshSession()) res = await send();
    if (res.status === 401) {
      toLogin();
      throw new AdminApiError(401, "UNAUTHORIZED", "Your session has expired");
    }
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) throw new AdminApiError(res.status, "BAD_RESPONSE", "Unexpected server response");
  if (!body.success) throw new AdminApiError(res.status, body.error.code, body.error.message, body.error.details);
  return body.data;
}
