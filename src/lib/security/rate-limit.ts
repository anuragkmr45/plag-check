type RateLimitStoreEntry = {
  count: number;
  resetAt: number;
};

type GlobalRateLimitState = typeof globalThis & {
  __plagcheckRateLimitStore?: Map<string, RateLimitStoreEntry>;
};

export type RateLimitInput = {
  key: string;
  limit: number;
  now?: number;
  windowMs: number;
};

export type RateLimitResult =
  | {
      allowed: true;
      limit: number;
      remaining: number;
      resetAt: number;
    }
  | {
      allowed: false;
      limit: number;
      remaining: 0;
      resetAt: number;
      retryAfterSeconds: number;
    };

const globalRateLimitState = globalThis as GlobalRateLimitState;

export function checkRateLimit(input: RateLimitInput): RateLimitResult {
  const now = input.now ?? Date.now();
  const store = getRateLimitStore();
  const existing = store.get(input.key);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + input.windowMs
        };

  if (entry.count >= input.limit) {
    store.set(input.key, entry);

    return {
      allowed: false,
      limit: input.limit,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    };
  }

  const nextEntry = {
    count: entry.count + 1,
    resetAt: entry.resetAt
  };
  store.set(input.key, nextEntry);

  return {
    allowed: true,
    limit: input.limit,
    remaining: Math.max(0, input.limit - nextEntry.count),
    resetAt: nextEntry.resetAt
  };
}

export function buildRateLimitKey(
  request: Pick<Request, "headers" | "url">,
  namespace: string,
  parts: readonly string[] = []
): string {
  return [
    namespace,
    getClientIp(request) ?? "unknown-ip",
    ...parts.map((part) => part.trim().toLowerCase()).filter(Boolean)
  ].join(":");
}

export function getClientIp(request: Pick<Request, "headers">): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return firstForwardedIp || request.headers.get("x-real-ip");
}

export function resetRateLimitStore(): void {
  getRateLimitStore().clear();
}

function getRateLimitStore(): Map<string, RateLimitStoreEntry> {
  globalRateLimitState.__plagcheckRateLimitStore ??= new Map();

  return globalRateLimitState.__plagcheckRateLimitStore;
}
