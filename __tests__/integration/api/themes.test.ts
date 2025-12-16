import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/themes/route';

describe('GET /api/themes', () => {
  it('should return document themes', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documentThemes).toBeDefined();
    expect(Array.isArray(data.documentThemes)).toBe(true);
  });

  it('should return code themes', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.codeThemes).toBeDefined();
    expect(Array.isArray(data.codeThemes)).toBe(true);
  });

  it('should include expected document themes', async () => {
    const response = await GET();
    const data = await response.json();

    const themeIds = data.documentThemes.map((t: { id: string }) => t.id);
    expect(themeIds).toContain('github');
    expect(themeIds).toContain('academic');
    expect(themeIds).toContain('minimal');
    expect(themeIds).toContain('dark');
    expect(themeIds).toContain('professional');
  });

  it('should include expected code themes', async () => {
    const response = await GET();
    const data = await response.json();

    const themeIds = data.codeThemes.map((t: { id: string }) => t.id);
    expect(themeIds).toContain('github-dark');
    expect(themeIds).toContain('github-light');
    expect(themeIds).toContain('monokai');
  });

  it('should have id, name, and description for each document theme', async () => {
    const response = await GET();
    const data = await response.json();

    data.documentThemes.forEach((theme: { id: string; name: string; description: string }) => {
      expect(theme.id).toBeDefined();
      expect(theme.name).toBeDefined();
      expect(theme.description).toBeDefined();
    });
  });

  it('should have id and name for each code theme', async () => {
    const response = await GET();
    const data = await response.json();

    data.codeThemes.forEach((theme: { id: string; name: string }) => {
      expect(theme.id).toBeDefined();
      expect(theme.name).toBeDefined();
    });
  });
});
