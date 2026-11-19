import { NextResponse } from "next/server";

/*
  Shared helpers for the /api/v1 endpoints.

  These are the endpoints the Flutter app calls, so the shapes here are a
  public contract: changing a field name breaks every installed copy of the
  app until people update it. Add fields, avoid renaming them, and if
  something has to change incompatibly, add /api/v2 instead.

  Every response is wrapped as { data } or { error }, so a client can tell
  success from failure without inspecting the status code.
*/

export interface ApiError {
  error: { message: string; code?: string };
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function err(
  message: string,
  status: number,
  code?: string,
): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}

/** 400, for a request the client should fix before retrying. */
export const badRequest = (message: string) =>
  err(message, 400, "bad_request");

/** 401, for a missing or expired session. */
export const unauthorized = (message = "Sign in to continue.") =>
  err(message, 401, "unauthorized");

/** 403, for a session that is valid but not allowed to do this. */
export const forbidden = (message = "You cannot do that.") =>
  err(message, 403, "forbidden");

/** 404, for something that does not exist or is not published. */
export const notFound = (message = "Not found.") => err(message, 404, "not_found");

/** 429, for too many requests. Retry-After is in whole seconds. */
export function tooManyRequests(retryAfter: number, message: string) {
  const response = err(message, 429, "rate_limited");
  response.headers.set("Retry-After", String(retryAfter));
  return response;
}

/** 503, for the database or storage not being configured. */
export const unavailable = (message: string) =>
  err(message, 503, "unavailable");

/**
 * Reads a positive integer query parameter, clamped to a maximum so one
 * client cannot ask for the whole table.
 */
export function intParam(
  params: URLSearchParams,
  name: string,
  fallback: number,
  max: number,
): number {
  const raw = params.get(name);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}
