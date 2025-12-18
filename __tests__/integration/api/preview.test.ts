import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Firebase admin before importing routes
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {},
  adminDb: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

// Mock auth config
vi.mock('@/lib/auth/config', () => ({
  authOptions: {},
}));

import { POST } from '@/app/api/preview/route';

// Reset rate limit state between tests
beforeEach(() => {
  vi.resetModules();
});

function createMockRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': `test-${Date.now()}-${Math.random()}`,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/preview', () => {
  it('should return HTML for valid markdown', async () => {
    const request = createMockRequest({
      markdown: '# Hello World',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.html).toBeDefined();
    expect(data.html).toContain('Hello World');
  });

  it('should apply specified theme', async () => {
    const request = createMockRequest({
      markdown: '# Test',
      theme: 'dark',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.html).toContain('theme-dark');
  });

  it('should return 400 for empty markdown', async () => {
    const request = createMockRequest({
      markdown: '',
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for missing markdown', async () => {
    const request = createMockRequest({});

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should include rate limit headers', async () => {
    const request = createMockRequest({
      markdown: '# Test',
    });

    const response = await POST(request);

    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
  });

  it('should use github theme by default', async () => {
    const request = createMockRequest({
      markdown: '# Test',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.html).toContain('theme-github');
  });

  it('should handle complex markdown', async () => {
    const complexMarkdown = `
# Title

## Subtitle

- Item 1
- Item 2

\`\`\`javascript
console.log('hello');
\`\`\`

| Col1 | Col2 |
|------|------|
| A    | B    |
`;

    const request = createMockRequest({
      markdown: complexMarkdown,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.html).toContain('Title');
    expect(data.html).toContain('Subtitle');
    expect(data.html).toContain('Item 1');
  });
});
