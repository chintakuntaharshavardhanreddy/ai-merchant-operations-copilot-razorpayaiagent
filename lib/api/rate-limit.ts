import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Each limiter instance tracks request timestamps per IP within a
 * configurable window. Stale entries are periodically pruned to
 * prevent unbounded memory growth in long-running server processes.
 *
 * Suitable for single-instance deployments (Vercel serverless,
 * single-node). For multi-instance horizontally-scaled deployments,
 * swap to Redis/Upstash-backed storage.
 */

interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RequestLog {
  timestamps: number[];
}

const CLEANUP_INTERVAL_MS = 60_000; // Prune stale entries every 60s

export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, RequestLog>();
  let lastCleanup = Date.now();

  function cleanup(now: number) {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    const cutoff = now - config.windowSeconds * 1000;
    for (const [key, log] of store.entries()) {
      log.timestamps = log.timestamps.filter((t) => t > cutoff);
      if (log.timestamps.length === 0) store.delete(key);
    }
  }

  function getClientIP(request: NextRequest): string {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  }

  /**
   * Check if the request should be rate-limited.
   * Returns null if allowed, or a 429 NextResponse if blocked.
   */
  function check(request: NextRequest): NextResponse | null {
    const now = Date.now();
    cleanup(now);

    const ip = getClientIP(request);
    const cutoff = now - config.windowSeconds * 1000;

    let log = store.get(ip);
    if (!log) {
      log = { timestamps: [] };
      store.set(ip, log);
    }

    // Remove timestamps outside the current window
    log.timestamps = log.timestamps.filter((t) => t > cutoff);

    if (log.timestamps.length >= config.maxRequests) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(config.windowSeconds),
          },
        }
      );
    }

    log.timestamps.push(now);
    return null;
  }

  return { check };
}

// Pre-configured limiters for each API route
export const chatRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowSeconds: 60,
});

export const actionsRateLimiter = createRateLimiter({
  maxRequests: 20,
  windowSeconds: 60,
});

export const analyticsRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowSeconds: 60,
});
