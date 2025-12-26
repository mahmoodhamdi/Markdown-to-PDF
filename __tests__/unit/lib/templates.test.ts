import { describe, it, expect } from 'vitest';
import {
  templates,
  getTemplateById,
  getTemplatesByCategory,
  getAllTemplates,
  getTemplatesForPlan,
  isTemplateAvailable,
  getTemplateStats,
} from '@/lib/pdf/templates';

describe('Templates', () => {
  describe('templates array', () => {
    it('should have 10 templates', () => {
      expect(templates).toHaveLength(10);
    });

    it('each template should have required properties', () => {
      templates.forEach((template) => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('content');
        expect(template).toHaveProperty('premium');
      });
    });

    it('should have templates in all categories', () => {
      const categories = Array.from(new Set(templates.map((t) => t.category)));
      expect(categories).toContain('business');
      expect(categories).toContain('academic');
      expect(categories).toContain('personal');
      expect(categories).toContain('technical');
    });

    it('should have both free and premium templates', () => {
      const freeTemplates = templates.filter((t) => !t.premium);
      const premiumTemplates = templates.filter((t) => t.premium);
      expect(freeTemplates.length).toBeGreaterThan(0);
      expect(premiumTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplateById', () => {
    it('should return template by id', () => {
      const template = getTemplateById('resume');
      expect(template).toBeDefined();
      expect(template?.id).toBe('resume');
      expect(template?.name).toBe('Resume / CV');
    });

    it('should return undefined for non-existent id', () => {
      const template = getTemplateById('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return business templates', () => {
      const businessTemplates = getTemplatesByCategory('business');
      expect(businessTemplates.length).toBeGreaterThan(0);
      businessTemplates.forEach((t) => {
        expect(t.category).toBe('business');
      });
    });

    it('should return academic templates', () => {
      const academicTemplates = getTemplatesByCategory('academic');
      expect(academicTemplates.length).toBeGreaterThan(0);
      academicTemplates.forEach((t) => {
        expect(t.category).toBe('academic');
      });
    });

    it('should return technical templates', () => {
      const technicalTemplates = getTemplatesByCategory('technical');
      expect(technicalTemplates.length).toBeGreaterThan(0);
      technicalTemplates.forEach((t) => {
        expect(t.category).toBe('technical');
      });
    });

    it('should return personal templates', () => {
      const personalTemplates = getTemplatesByCategory('personal');
      expect(personalTemplates.length).toBeGreaterThan(0);
      personalTemplates.forEach((t) => {
        expect(t.category).toBe('personal');
      });
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates', () => {
      const allTemplates = getAllTemplates();
      expect(allTemplates).toHaveLength(10);
    });
  });

  describe('getTemplatesForPlan', () => {
    it('should return only free templates for free plan', () => {
      const freeTemplates = getTemplatesForPlan('free');
      expect(freeTemplates.length).toBe(6); // 6 free templates
      freeTemplates.forEach((t) => {
        expect(t.premium).toBeFalsy();
      });
    });

    it('should return all templates for pro plan', () => {
      const proTemplates = getTemplatesForPlan('pro');
      expect(proTemplates).toHaveLength(10);
    });

    it('should return all templates for team plan', () => {
      const teamTemplates = getTemplatesForPlan('team');
      expect(teamTemplates).toHaveLength(10);
    });

    it('should return all templates for enterprise plan', () => {
      const enterpriseTemplates = getTemplatesForPlan('enterprise');
      expect(enterpriseTemplates).toHaveLength(10);
    });

    it('free plan templates should include resume, cover-letter, report, readme, meeting, blog-post', () => {
      const freeTemplates = getTemplatesForPlan('free');
      const ids = freeTemplates.map((t) => t.id);
      expect(ids).toContain('resume');
      expect(ids).toContain('cover-letter');
      expect(ids).toContain('report');
      expect(ids).toContain('readme');
      expect(ids).toContain('meeting');
      expect(ids).toContain('blog-post');
    });

    it('free plan templates should NOT include thesis, invoice, proposal, documentation', () => {
      const freeTemplates = getTemplatesForPlan('free');
      const ids = freeTemplates.map((t) => t.id);
      expect(ids).not.toContain('thesis');
      expect(ids).not.toContain('invoice');
      expect(ids).not.toContain('proposal');
      expect(ids).not.toContain('documentation');
    });

    it('pro plan templates should include premium templates', () => {
      const proTemplates = getTemplatesForPlan('pro');
      const ids = proTemplates.map((t) => t.id);
      expect(ids).toContain('thesis');
      expect(ids).toContain('invoice');
      expect(ids).toContain('proposal');
      expect(ids).toContain('documentation');
    });
  });

  describe('isTemplateAvailable', () => {
    it('should return true for free template on free plan', () => {
      expect(isTemplateAvailable('resume', 'free')).toBe(true);
      expect(isTemplateAvailable('cover-letter', 'free')).toBe(true);
      expect(isTemplateAvailable('report', 'free')).toBe(true);
      expect(isTemplateAvailable('readme', 'free')).toBe(true);
      expect(isTemplateAvailable('meeting', 'free')).toBe(true);
      expect(isTemplateAvailable('blog-post', 'free')).toBe(true);
    });

    it('should return false for premium template on free plan', () => {
      expect(isTemplateAvailable('thesis', 'free')).toBe(false);
      expect(isTemplateAvailable('invoice', 'free')).toBe(false);
      expect(isTemplateAvailable('proposal', 'free')).toBe(false);
      expect(isTemplateAvailable('documentation', 'free')).toBe(false);
    });

    it('should return true for all templates on pro plan', () => {
      expect(isTemplateAvailable('resume', 'pro')).toBe(true);
      expect(isTemplateAvailable('thesis', 'pro')).toBe(true);
      expect(isTemplateAvailable('invoice', 'pro')).toBe(true);
      expect(isTemplateAvailable('proposal', 'pro')).toBe(true);
      expect(isTemplateAvailable('documentation', 'pro')).toBe(true);
    });

    it('should return true for all templates on team plan', () => {
      expect(isTemplateAvailable('resume', 'team')).toBe(true);
      expect(isTemplateAvailable('thesis', 'team')).toBe(true);
      expect(isTemplateAvailable('invoice', 'team')).toBe(true);
    });

    it('should return true for all templates on enterprise plan', () => {
      expect(isTemplateAvailable('resume', 'enterprise')).toBe(true);
      expect(isTemplateAvailable('thesis', 'enterprise')).toBe(true);
      expect(isTemplateAvailable('documentation', 'enterprise')).toBe(true);
    });

    it('should return false for non-existent template', () => {
      expect(isTemplateAvailable('non-existent', 'free')).toBe(false);
      expect(isTemplateAvailable('non-existent', 'pro')).toBe(false);
    });
  });

  describe('getTemplateStats', () => {
    it('should return correct stats', () => {
      const stats = getTemplateStats();
      expect(stats.total).toBe(10);
      expect(stats.free).toBe(6);
      expect(stats.premium).toBe(4);
    });

    it('free + premium should equal total', () => {
      const stats = getTemplateStats();
      expect(stats.free + stats.premium).toBe(stats.total);
    });
  });

  describe('Template content', () => {
    it('resume template should have proper markdown structure', () => {
      const template = getTemplateById('resume');
      expect(template?.content).toContain('# John Doe');
      expect(template?.content).toContain('## Software Engineer');
      expect(template?.content).toContain('## Experience');
      expect(template?.content).toContain('## Education');
      expect(template?.content).toContain('## Skills');
    });

    it('thesis template should have academic structure', () => {
      const template = getTemplateById('thesis');
      expect(template?.content).toContain('# The Impact of Artificial Intelligence');
      expect(template?.content).toContain('## Abstract');
      expect(template?.content).toContain('## Chapter 1');
      expect(template?.content).toContain('## References');
    });

    it('invoice template should have business structure', () => {
      const template = getTemplateById('invoice');
      expect(template?.content).toContain('# INVOICE');
      expect(template?.content).toContain('Invoice Number');
      expect(template?.content).toContain('## Services');
      expect(template?.content).toContain('**Total Due**');
    });

    it('documentation template should have technical structure', () => {
      const template = getTemplateById('documentation');
      expect(template?.content).toContain('# API Documentation');
      expect(template?.content).toContain('## Authentication');
      expect(template?.content).toContain('## Endpoints');
      expect(template?.content).toContain('## Error Handling');
    });
  });
});
