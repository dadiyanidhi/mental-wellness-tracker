import "server-only";
import type { NextRequest } from "next/server";

/**
 * Minimal in-memory, per-IP fixed-window rate limiter.
 *
 * This is deliberately dependency-free and good enough for a single-instance
 * deployment / demo. For multi-instance production you would swap the Map for
 * a shared store (e.g. Upstash Redis) behind the same interface. The point is
 * to keep an abuse ceiling on the (paid) model calls — a security/efficiency
 * concern, not just throttling.
 */

const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || "local";
  return `${scope}:${ip}`;
}

/** Returns true if the request is allowed, false if the limit is exceeded. */
export function rateLimit(
  req: NextRequest,
  scope: string,
  maxPerMinute: number
): boolean {
  const key = clientKey(req, scope);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= maxPerMinute) return false;
  bucket.count += 1;
  return true;
}
