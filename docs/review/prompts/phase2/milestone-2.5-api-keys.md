# Milestone 2.5: API Key Authentication

## Status: ✅ Complete
## Priority: MEDIUM
## Estimated Scope: Large
## Completed: 2025-12-30

---

## Objective

Implement API key authentication for programmatic access to the conversion API, enabling third-party integrations.

---

## Current State

Currently, all API access requires:
- Session-based authentication (NextAuth)
- No API key support for external applications

---

## Implementation Plan

### 1. API Key Model

```typescript
// src/lib/db/models/ApiKey.ts
import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true }, // User-friendly name
  keyHash: { type: String, required: true, unique: true }, // SHA256 hash
  keyPrefix: { type: String, required: true }, // First 8 chars for identification
  permissions: [{
    type: String,
    enum: ['convert', 'preview', 'batch', 'templates', 'themes'],
  }],
  rateLimit: {
    limit: { type: Number, default: 100 },
    window: { type: Number, default: 60 }, // seconds
  },
  lastUsedAt: { type: Date },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
});

// Generate new API key
apiKeySchema.statics.generate = async function(userId: string, name: string, permissions: string[]) {
  const key = `mk_${crypto.randomBytes(32).toString('hex')}`; // mk_ prefix for markdown-to-pdf
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 11); // "mk_" + 8 chars

  const apiKey = await this.create({
    userId,
    name,
    keyHash,
    keyPrefix,
    permissions,
  });

  return { apiKey, plainKey: key }; // Return plain key only once
};

// Verify API key
apiKeySchema.statics.verify = async function(key: string) {
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const apiKey = await this.findOne({
    keyHash,
    revokedAt: null,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  });

  if (apiKey) {
    apiKey.lastUsedAt = new Date();
    await apiKey.save();
  }

  return apiKey;
};

export const ApiKey = mongoose.models.ApiKey || mongoose.model('ApiKey', apiKeySchema);
```

### 2. API Key Middleware

```typescript
// src/lib/auth/api-key-auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiKey } from '@/lib/db/models/ApiKey';
import { connectDB } from '@/lib/db/mongodb';

export interface ApiKeyUser {
  id: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  permissions: string[];
  rateLimit: { limit: number; window: number };
}

export async function authenticateApiKey(
  request: NextRequest
): Promise<ApiKeyUser | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer mk_')) {
    return null;
  }

  const key = authHeader.substring(7); // Remove "Bearer "

  await connectDB();
  const apiKey = await ApiKey.verify(key);

  if (!apiKey) {
    return null;
  }

  // Get user plan
  const user = await User.findById(apiKey.userId);

  return {
    id: apiKey.userId,
    plan: user?.plan || 'free',
    permissions: apiKey.permissions,
    rateLimit: apiKey.rateLimit,
  };
}
```

### 3. API Routes for Key Management

```typescript
// src/app/api/api-keys/route.ts
// GET - List user's API keys
// POST - Create new API key

// src/app/api/api-keys/[keyId]/route.ts
// GET - Get API key details
// DELETE - Revoke API key
// PATCH - Update API key name/permissions
```

### 4. Update Conversion Endpoints

```typescript
// src/app/api/convert/route.ts
export async function POST(request: NextRequest) {
  // Try API key auth first
  const apiKeyUser = await authenticateApiKey(request);

  if (apiKeyUser) {
    // Verify permission
    if (!apiKeyUser.permissions.includes('convert')) {
      return NextResponse.json(
        { error: 'API key lacks convert permission' },
        { status: 403 }
      );
    }

    // Use API key rate limits
    const rateLimitResult = await checkRateLimit(
      `api:${apiKeyUser.id}`,
      apiKeyUser.rateLimit.limit,
      apiKeyUser.rateLimit.window * 1000
    );

    if (!rateLimitResult.success) {
      return createRateLimitErrorResponse(rateLimitResult);
    }

    // Process conversion with apiKeyUser context
    return processConversion(request, apiKeyUser);
  }

  // Fall back to session auth
  const session = await getServerSession(authOptions);
  // ... existing session-based logic
}
```

---

## Dashboard UI

### API Keys Page
**File:** `src/app/[locale]/dashboard/api-keys/page.tsx`

Features:
- List all API keys
- Create new key (show once)
- Revoke key
- View key usage stats
- Copy key prefix for identification

### UI Layout
```
┌─────────────────────────────────────────────────────────┐
│ API Keys                                    [+ New Key] │
├─────────────────────────────────────────────────────────┤
│ Your API keys are used to authenticate API requests.   │
│ Keep them secret - they provide full API access.       │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Production Key              mk_a1b2c3d4...          │ │
│ │ Created: Jan 1, 2024        Last used: 2 hours ago  │ │
│ │ Permissions: convert, preview, batch                │ │
│ │                                         [Revoke]    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Development Key             mk_x9y8z7w6...          │ │
│ │ Created: Dec 15, 2023       Never used              │ │
│ │ Permissions: convert, preview                       │ │
│ │                                         [Revoke]    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## API Documentation

Update API docs to include authentication:

```markdown
## Authentication

### Session-Based (Web App)
Automatic via cookies for logged-in users.

### API Key (Programmatic)
Include your API key in the Authorization header:

```bash
curl -X POST https://example.com/api/convert \
  -H "Authorization: Bearer mk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello"}'
```

### Permissions
- `convert` - PDF conversion
- `preview` - HTML preview
- `batch` - Batch conversion
- `templates` - Access templates
- `themes` - Access themes
```

---

## Plan-Based Limits

```typescript
const API_KEY_LIMITS = {
  free: { maxKeys: 1, rateLimit: 100 },
  pro: { maxKeys: 5, rateLimit: 500 },
  team: { maxKeys: 20, rateLimit: 2000 },
  enterprise: { maxKeys: 100, rateLimit: 10000 },
};
```

---

## Files to Create

1. `src/lib/db/models/ApiKey.ts`
2. `src/lib/auth/api-key-auth.ts`
3. `src/app/api/api-keys/route.ts`
4. `src/app/api/api-keys/[keyId]/route.ts`
5. `src/app/[locale]/dashboard/api-keys/page.tsx`
6. `src/components/dashboard/ApiKeyList.tsx`
7. `src/components/dashboard/CreateApiKeyDialog.tsx`

## Files to Modify

1. `src/app/api/convert/route.ts`
2. `src/app/api/preview/route.ts`
3. `src/app/api/convert/batch/route.ts`
4. `src/components/dashboard/DashboardSidebar.tsx` - Add API Keys link

---

## Testing

### Unit Tests:
1. API key generation
2. API key verification
3. Expired key rejection
4. Revoked key rejection
5. Permission checking

### Integration Tests:
1. API request with valid key
2. API request with invalid key
3. API request with insufficient permissions
4. Rate limiting with API key

---

## Acceptance Criteria

- [ ] API keys can be created
- [ ] API keys can be revoked
- [ ] API key auth works on convert/preview/batch
- [ ] Permissions enforced
- [ ] Rate limits enforced
- [ ] Dashboard UI for key management
- [ ] API documentation updated
- [ ] Plan-based key limits
- [ ] Tests passing

---

## Completion Checklist

When done, update `docs/review/MASTER_REVIEW_PLAN.md`:
1. Change milestone 2.5 status to ✅
2. Update progress bar
3. Add to completion log
