import { NextResponse, type NextRequest } from "next/server";

/*
  Two jobs, because Next allows exactly one proxy file.

  1. /admin - send signed-out visitors to the login page.
  2. /api/v1 - CORS, so the Flutter app can call the API from a browser.

  This is a fast first filter ONLY. It checks that a session cookie is
  present, not that it is valid, because middleware runs on every request and
  should not hit the database. The real check is requireAdmin() in
  lib/auth.ts, which every admin page and Server Action calls.

  That split matters more than it used to: without Supabase's Row Level
  Security, requireAdmin() is the only thing protecting the data.
*/

/* ---------------------------------------------------------------- *
 * CORS for /api/v1                                                   *
 * ---------------------------------------------------------------- */

/*
  Why this is needed at all: `flutter run -d web-server` serves the app
  from http://127.0.0.1:8080 while the API is on :3000. A different port
  is a different origin, so without these headers the browser blocks every
  response - and reports it as a network failure, which looks exactly like
  the server being down.

  Native builds (Android, iOS) never hit this: CORS is a browser rule.

  Deliberately narrow:

    - Only localhost and 127.0.0.1, and only outside production. A
      stranger's website must never be able to call this API from their
      visitors' browsers using their visitors' sessions.
    - The origin is echoed back rather than answered with "*", because "*"
      cannot be combined with credentials and would also allow every site
      on the internet.
    - If a real web client is ever hosted on its own domain, add that one
      origin here. Do not reach for a wildcard.
*/
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function allowedOrigin(request: NextRequest): string | null {
  if (process.env.NODE_ENV === "production") return null;
  const origin = request.headers.get("origin");
  return origin && LOCAL_ORIGIN.test(origin) ? origin : null;
}

function applyCors(headers: Headers, origin: string) {
  headers.set("Access-Control-Allow-Origin", origin);
  // Without Vary, a cache can hand one origin's response to another.
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
}

function corsProxy(request: NextRequest) {
  const origin = allowedOrigin(request);
  if (!origin) return NextResponse.next();

  /*
    The preflight. A plain GET never preflights, but sending Authorization
    or Content-Type: application/json does - so signing in and sending an
    enquiry both depend on this branch.
  */
  if (request.method === "OPTIONS") {
    const headers = new Headers({ "Access-Control-Max-Age": "86400" });
    applyCors(headers, origin);
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  applyCors(response.headers, origin);
  return response;
}

/* ---------------------------------------------------------------- *
 * Admin auth                                                        *
 * ---------------------------------------------------------------- */

const SESSION_COOKIE = "zubia_session";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/v1")) return corsProxy(request);

  // Pages someone must be able to reach while signed out.
  const isPublicAdminPage =
    path === "/admin/login" ||
    path === "/admin/setup" ||
    path === "/admin/accept-invite";
  if (isPublicAdminPage) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (!hasSession) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // The public API and the admin area. Never the website's own pages:
  // they are same-origin and need neither branch.
  matcher: ["/admin/:path*", "/api/v1/:path*"],
};
