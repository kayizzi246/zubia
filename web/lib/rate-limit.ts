import "server-only";

/*
  A small fixed-window rate limiter.

  Why in memory: Zubia runs as one Node process against one Postgres, and
  a counter in memory costs nothing and cannot fail. The trade-off is
  real and worth stating plainly:

    - Counters reset when the server restarts or redeploys.
    - Each instance counts on its own, so N instances allow N times the
      limit.

  Neither matters for a single VPS, which is where this launches. If
  Zubia ever runs more than one instance, move the counters into Postgres
  or Redis and keep this module's signature - nothing else has to change.

  This is a speed bump against password guessing and enquiry spam, not a
  defence against a determined distributed attack. That belongs at the
  edge (Cloudflare), in front of the app.
*/

interface Window {
  /** How many requests have been counted in the current window. */
  count: number;
  /** When the current window ends, as epoch ms. */
  resetAt: number;
}

// Next.js reloads modules on every edit in development, which would drop
// the counters each time, so they are cached on globalThis as the
// database pool is.
const globalForLimit = globalThis as unknown as {
  zubiaRateLimit?: Map<string, Window>;
  zubiaRateLimitSweep?: ReturnType<typeof setInterval>;
};

const windows = (globalForLimit.zubiaRateLimit ??= new Map<string, Window>());

/*
  Without a sweep the map grows by one entry per distinct key forever,
  which is a slow memory leak an attacker could drive on purpose by
  varying the key. unref() so a pending sweep never holds the process
  open on shutdown.
*/
if (!globalForLimit.zubiaRateLimitSweep) {
  const sweep = setInterval(
    () => {
      const now = Date.now();
      for (const [key, window] of windows) {
        if (window.resetAt <= now) windows.delete(key);
      }
    },
    5 * 60_000,
  );
  sweep.unref?.();
  globalForLimit.zubiaRateLimitSweep = sweep;
}

export interface RateLimitResult {
  /** False when the caller should be turned away. */
  allowed: boolean;
  /** Requests left in this window, after counting the current one. */
  remaining: number;
  /** Whole seconds until the window resets; for the Retry-After header. */
  retryAfter: number;
}

/**
 * Counts one request against `key` and says whether to allow it.
 *
 * A blocked request still does not extend the window: the caller waits
 * out the original window rather than being locked out forever by
 * retrying, which would make a lockout trivial to inflict on someone
 * else's account.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfter };
}

/**
 * The caller's IP, as far as it can be trusted.
 *
 * Behind a proxy the left-most x-forwarded-for entry is the client; it is
 * also client-controlled, so it is a convenience for rate limiting and
 * never an identity. Falls back to a single shared bucket, which fails
 * closed: with no IP everyone shares one limit rather than everyone
 * getting their own.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
