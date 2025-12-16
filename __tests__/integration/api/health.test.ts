import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/health/route';

describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });

  it('should include version', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.version).toBe('1.0.0');
  });

  it('should include timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    // Verify it's a valid ISO date string
    expect(() => new Date(data.timestamp)).not.toThrow();
  });
});
