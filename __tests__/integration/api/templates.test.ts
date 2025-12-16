import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/templates/route';

describe('GET /api/templates', () => {
  it('should return templates array', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    expect(Array.isArray(data.templates)).toBe(true);
  });

  it('should return at least one template', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.templates.length).toBeGreaterThan(0);
  });

  it('should have id, name, description, and category for each template', async () => {
    const response = await GET();
    const data = await response.json();

    data.templates.forEach((template: { id: string; name: string; description: string; category: string }) => {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.category).toBeDefined();
    });
  });

  it('should include templates from different categories', async () => {
    const response = await GET();
    const data = await response.json();

    const categories = [...new Set(data.templates.map((t: { category: string }) => t.category))];
    expect(categories.length).toBeGreaterThan(1);
  });

  it('should include common template types', async () => {
    const response = await GET();
    const data = await response.json();

    const ids = data.templates.map((t: { id: string }) => t.id);
    // Check for at least some expected templates
    const expectedIds = ['resume', 'report', 'readme', 'meeting'];
    const hasAtLeastOne = expectedIds.some(id => ids.includes(id));
    expect(hasAtLeastOne).toBe(true);
  });
});
