# Milestone 4.1: Database Query Optimization

## Status: ⬜ Not Started
## Priority: MEDIUM
## Estimated Scope: Medium

---

## Objective

Optimize MongoDB queries for better performance at scale.

---

## Areas to Review

### 1. Index Analysis

**Check existing indexes:**
```javascript
// Run in MongoDB shell
db.users.getIndexes()
db.teams.getIndexes()
db.userfiles.getIndexes()
db.usageevents.getIndexes()
```

**Recommended indexes:**

```typescript
// User model
{ email: 1 } // Unique, for lookups
{ plan: 1, createdAt: -1 } // For admin queries
{ 'stripeCustomerId': 1 } // For webhook lookups

// Team model
{ ownerId: 1 } // For user's teams
{ 'members.userId': 1 } // For member lookup
{ 'members.email': 1 } // For invitation lookup

// UserFile model
{ userId: 1, createdAt: -1 } // For file listing
{ userId: 1, 'metadata.type': 1 } // For filtered queries

// UsageEvent model
{ userId: 1, date: 1 } // Compound for daily queries
{ userId: 1, eventType: 1, date: 1 } // For filtered analytics

// Session model
{ userId: 1 } // For user sessions
{ token: 1 } // Unique, for verification
{ expiresAt: 1 } // TTL index

// TeamMemberLookup
{ userId: 1 } // For user's teams
{ teamId: 1, userId: 1 } // Compound unique
```

### 2. Query Optimization

**Review common queries:**

```typescript
// Before: Inefficient
const teams = await Team.find({});
const userTeams = teams.filter(t => t.members.some(m => m.userId === userId));

// After: Optimized
const userTeams = await Team.find({ 'members.userId': userId });
```

```typescript
// Before: N+1 query
const files = await UserFile.find({ userId });
for (const file of files) {
  file.owner = await User.findById(file.userId);
}

// After: Single query with populate or aggregation
const files = await UserFile.aggregate([
  { $match: { userId } },
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'owner' } },
  { $unwind: '$owner' },
]);
```

### 3. Aggregation Pipeline Optimization

**Analytics queries:**

```typescript
// Optimized daily usage aggregation
const dailyUsage = await UsageEvent.aggregate([
  {
    $match: {
      userId,
      date: { $gte: startDate, $lte: endDate },
    },
  },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      conversions: {
        $sum: { $cond: [{ $eq: ['$eventType', 'conversion'] }, 1, 0] },
      },
      apiCalls: {
        $sum: { $cond: [{ $eq: ['$eventType', 'api_call'] }, 1, 0] },
      },
    },
  },
  { $sort: { _id: 1 } },
]);
```

### 4. Connection Pooling

**Verify proper connection handling:**

```typescript
// src/lib/db/mongodb.ts
const options = {
  maxPoolSize: 10, // Adjust based on load
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Ensure single connection instance
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
```

### 5. Lean Queries

Use `.lean()` for read-only operations:

```typescript
// Before: Returns full Mongoose documents
const users = await User.find({ plan: 'pro' });

// After: Returns plain objects (faster)
const users = await User.find({ plan: 'pro' }).lean();
```

---

## Performance Monitoring

Add query timing:

```typescript
// Middleware for query timing
mongoose.plugin((schema) => {
  schema.pre('find', function () {
    this._startTime = Date.now();
  });

  schema.post('find', function () {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      if (duration > 100) {
        console.warn(`Slow query (${duration}ms):`, this.getQuery());
      }
    }
  });
});
```

---

## Caching Strategy

Consider caching for:
- User plan limits (changes rarely)
- Theme/template lists (static)
- User session data

```typescript
// Simple in-memory cache for plan limits
const planLimitsCache = new Map<string, { limits: PlanLimits; expires: number }>();

export function getCachedPlanLimits(plan: PlanType): PlanLimits {
  const cached = planLimitsCache.get(plan);
  if (cached && cached.expires > Date.now()) {
    return cached.limits;
  }

  const limits = getPlanLimits(plan);
  planLimitsCache.set(plan, {
    limits,
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return limits;
}
```

---

## Files to Modify

1. `src/lib/db/mongodb.ts` - Connection options
2. `src/lib/db/models/*.ts` - Add indexes
3. `src/lib/analytics/service.ts` - Optimize queries
4. `src/lib/storage/service.ts` - Optimize queries
5. `src/lib/teams/service.ts` - Optimize queries

---

## Testing

1. Run before/after benchmarks
2. Check query explain plans
3. Monitor under load
4. Verify index usage

---

## Acceptance Criteria

- [ ] All necessary indexes created
- [ ] No N+1 queries
- [ ] .lean() used for read-only
- [ ] Connection pooling configured
- [ ] Slow query logging added
- [ ] Aggregations optimized
- [ ] Performance benchmarks documented

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 4.1 status to ✅
2. Update progress bar
3. Add to completion log
