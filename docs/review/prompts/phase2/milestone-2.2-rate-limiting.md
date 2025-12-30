# Milestone 2.2: Rate Limiting Enhancement

## Status: ⬜ Not Started
## Priority: HIGH
## Estimated Scope: Medium

---

## Objective

Enhance rate limiting to be production-ready with persistent storage and better granularity.

---

## Current State

### Existing Implementation:
- `src/lib/rate-limit.ts` - Simple in-memory rate limiter
- `src/lib/plans/rate-limit.ts` - Plan-aware rate limiter

### Current Issues:
1. **In-memory only** - Lost on server restart
2. **No distributed support** - Doesn't work with multiple instances
3. **IP-based for anonymous** - Can be bypassed
4. **Limited granularity** - No per-endpoint customization

---

## Enhancement Options

### Option A: Redis-Based Rate Limiting (Recommended)

```typescript
// src/lib/rate-limit-redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;

  const current = await redis.incr(windowKey);
  if (current === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  const remaining = Math.max(0, limit - current);
  const reset = (Math.floor(now / windowSeconds) + 1) * windowSeconds;

  return {
    success: current <= limit,
    remaining,
    reset,
  };
}
```

### Option B: Database-Based Fallback

```typescript
// If Redis not available, use MongoDB
import { RateLimitEntry } from '@/lib/db/models/RateLimit';

export async function checkRateLimitDB(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMs);

  const count = await RateLimitEntry.countDocuments({
    key,
    timestamp: { $gte: windowStart },
  });

  if (count < limit) {
    await RateLimitEntry.create({ key, timestamp: new Date() });
    return { success: true, remaining: limit - count - 1 };
  }

  return { success: false, remaining: 0 };
}
```

---

## Rate Limit Configuration

### Per-Endpoint Limits:

```typescript
// src/lib/rate-limit/config.ts
export const RATE_LIMITS = {
  // Conversion endpoints
  'convert': { limit: 60, window: 60 }, // 60/min
  'convert:batch': { limit: 10, window: 60 }, // 10/min
  'preview': { limit: 120, window: 60 }, // 120/min

  // Auth endpoints
  'auth:login': { limit: 5, window: 900 }, // 5 per 15 min
  'auth:register': { limit: 5, window: 3600 }, // 5 per hour
  'auth:forgot-password': { limit: 3, window: 3600 }, // 3 per hour

  // Storage endpoints
  'storage:upload': { limit: 30, window: 60 }, // 30/min
  'storage:download': { limit: 100, window: 60 }, // 100/min

  // Team endpoints
  'teams:create': { limit: 5, window: 60 }, // 5/min
  'teams:invite': { limit: 20, window: 60 }, // 20/min

  // Profile endpoints
  'profile:update': { limit: 10, window: 60 }, // 10/min
  'profile:delete': { limit: 1, window: 3600 }, // 1 per hour

  // Webhook endpoints (higher limits)
  'webhook:stripe': { limit: 1000, window: 60 },
  'webhook:paddle': { limit: 1000, window: 60 },
};
```

---

## Implementation Steps

### Step 1: Add Redis Client (Optional)

```bash
npm install @upstash/redis
```

Add env vars:
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Step 2: Create Unified Rate Limiter

```typescript
// src/lib/rate-limit/index.ts
export async function rateLimit(
  request: Request,
  endpoint: string,
  userId?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[endpoint];
  const key = userId || getIpAddress(request);

  // Try Redis first, fallback to memory
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return checkRateLimitRedis(`${endpoint}:${key}`, config.limit, config.window);
  }

  return checkRateLimitMemory(`${endpoint}:${key}`, config.limit, config.window);
}
```

### Step 3: Add Middleware Helper

```typescript
// src/lib/rate-limit/middleware.ts
export async function withRateLimit(
  request: Request,
  endpoint: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  const result = await rateLimit(request, endpoint, session?.user?.id);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: result.reset },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset),
          'Retry-After': String(result.reset - Math.floor(Date.now() / 1000)),
        },
      }
    );
  }

  const response = await handler();

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(result.reset));

  return response;
}
```

---

## Files to Create/Modify

### Create:
1. `src/lib/rate-limit/config.ts` - Rate limit configuration
2. `src/lib/rate-limit/redis.ts` - Redis implementation
3. `src/lib/rate-limit/middleware.ts` - Middleware helper
4. `src/lib/db/models/RateLimit.ts` - MongoDB fallback model

### Modify:
1. `src/lib/rate-limit.ts` - Refactor existing
2. `src/lib/plans/rate-limit.ts` - Integrate with new system
3. All API routes to use new middleware

---

## Environment Variables

Add to `.env.example`:
```
# Rate Limiting (Optional - uses in-memory if not set)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## Testing

### Unit Tests:
1. Rate limit counting works correctly
2. Window reset works
3. Different endpoints have different limits
4. User-based vs IP-based keying

### Integration Tests:
1. Rate limit headers returned
2. 429 response when limit exceeded
3. Retry-After header accurate

---

## Acceptance Criteria

- [ ] Unified rate limit configuration
- [ ] Redis support (optional)
- [ ] Fallback to in-memory
- [ ] All endpoints use consistent limiting
- [ ] Rate limit headers on all responses
- [ ] 429 responses include Retry-After
- [ ] Plan-aware limits still work
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 2.2 status to ✅
2. Update progress bar
3. Add to completion log
