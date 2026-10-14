import { NextResponse, type NextRequest } from "next/server";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const AUTH_COOKIES = ["access_token", "refresh_token"] as const;

async function apiCall(path: string, method: "GET" | "POST", cookie: string): Promise<Response | null> {
  try {
    return await fetch(`${API}/api/v1${path}`, { method, headers: { cookie }, cache: "no-store" });
  } catch {
    return null;
  }
}

/** "name=value; Path=/; HttpOnly" -> ["name", "value"] */
const cookiePair = (setCookie: string): [string, string] => {
  const first = setCookie.split(";")[0] ?? "";
  const i = first.indexOf("=");
  return [first.slice(0, i), first.slice(i + 1)];
};

/**
 * Guards /admin/*. The access token is verified against the API (/auth/me); if it has expired but a
 * refresh token exists, the session is refreshed here so the page loads without a login bounce.
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const isLogin = pathname === "/admin/login";
  const cookieHeader = req.headers.get("cookie") ?? "";

  // Link prefetches only need to know a session cookie exists: admin pages render no private data
  // on the server (everything is fetched by the browser with the cookie and checked by the API),
  // so skipping the /auth/me round-trip avoids a burst of API calls per page view.
  const isPrefetch = req.headers.has("next-router-prefetch") || req.headers.get("purpose") === "prefetch";
  if (isPrefetch && !isLogin) {
    return req.cookies.get("access_token") || req.cookies.get("refresh_token")
      ? NextResponse.next()
      : new NextResponse(null, { status: 401 });
  }

  let authed = false;
  let refreshed: string[] = [];

  if (req.cookies.get("access_token")) {
    authed = (await apiCall("/auth/me", "GET", cookieHeader))?.ok ?? false;
  }
  if (!authed && req.cookies.get("refresh_token")) {
    const res = await apiCall("/auth/refresh", "POST", cookieHeader);
    if (res?.ok) {
      authed = true;
      refreshed = res.headers.getSetCookie();
    }
  }

  if (!authed) {
    if (isLogin) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    for (const name of AUTH_COOKIES) redirect.cookies.delete(name);
    return redirect;
  }

  let response: NextResponse;
  if (isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    response = NextResponse.redirect(url);
  } else if (refreshed.length > 0) {
    // Make the new tokens visible to this very request as well as to the browser.
    const headers = new Headers(req.headers);
    const jar = new Map(
      cookieHeader
        .split(/;\s*/)
        .filter(Boolean)
        .map((c): [string, string] => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)]),
    );
    for (const sc of refreshed) jar.set(...cookiePair(sc));
    headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    response = NextResponse.next({ request: { headers } });
  } else {
    response = NextResponse.next();
  }
  for (const sc of refreshed) response.headers.append("set-cookie", sc);
  response.headers.set("cache-control", "no-store");
  return response;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
