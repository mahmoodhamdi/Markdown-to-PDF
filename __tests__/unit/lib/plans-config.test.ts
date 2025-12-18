import { describe, it, expect } from 'vitest';
import {
  PLANS,
  getPlanLimits,
  getPlan,
  isThemeAvailable,
  formatFileSize,
  PlanType,
} from '@/lib/plans/config';

describe('Plan Configuration', () => {
  describe('PLANS', () => {
    it('should have all four plans defined', () => {
      expect(PLANS).toHaveProperty('free');
      expect(PLANS).toHaveProperty('pro');
      expect(PLANS).toHaveProperty('team');
      expect(PLANS).toHaveProperty('enterprise');
    });

    it('should have correct prices for free plan', () => {
      expect(PLANS.free.priceMonthly).toBe(0);
      expect(PLANS.free.priceYearly).toBe(0);
    });

    it('should have correct prices for pro plan', () => {
      expect(PLANS.pro.priceMonthly).toBe(5);
      expect(PLANS.pro.priceYearly).toBe(48); // 20% discount
    });

    it('should have correct prices for team plan', () => {
      expect(PLANS.team.priceMonthly).toBe(15);
      expect(PLANS.team.priceYearly).toBe(144); // 20% discount
    });

    it('should have correct prices for enterprise plan', () => {
      expect(PLANS.enterprise.priceMonthly).toBe(99);
      expect(PLANS.enterprise.priceYearly).toBe(948); // 20% discount
    });
  });

  describe('Plan Limits', () => {
    describe('Free Plan', () => {
      const limits = PLANS.free.limits;

      it('should have 20 conversions per day', () => {
        expect(limits.conversionsPerDay).toBe(20);
      });

      it('should have 500 KB max file size', () => {
        expect(limits.maxFileSize).toBe(500 * 1024);
      });

      it('should have 100 API calls per day', () => {
        expect(limits.apiCallsPerDay).toBe(100);
      });

      it('should have 5 max batch files', () => {
        expect(limits.maxBatchFiles).toBe(5);
      });

      it('should have watermark enabled', () => {
        expect(limits.hasWatermark).toBe(true);
        expect(limits.watermarkText).toBe('Made with MD2PDF');
      });

      it('should have 3 available themes', () => {
        expect(limits.availableThemes).toHaveLength(3);
        expect(limits.availableThemes).toContain('github');
        expect(limits.availableThemes).toContain('minimal');
        expect(limits.availableThemes).toContain('dark');
      });

      it('should not allow custom CSS', () => {
        expect(limits.customCssAllowed).toBe(false);
      });

      it('should not have cloud storage', () => {
        expect(limits.cloudStorageBytes).toBe(0);
      });
    });

    describe('Pro Plan', () => {
      const limits = PLANS.pro.limits;

      it('should have 500 conversions per day', () => {
        expect(limits.conversionsPerDay).toBe(500);
      });

      it('should have 5 MB max file size', () => {
        expect(limits.maxFileSize).toBe(5 * 1024 * 1024);
      });

      it('should have 2000 API calls per day', () => {
        expect(limits.apiCallsPerDay).toBe(2000);
      });

      it('should have 50 max batch files', () => {
        expect(limits.maxBatchFiles).toBe(50);
      });

      it('should not have watermark', () => {
        expect(limits.hasWatermark).toBe(false);
        expect(limits.watermarkText).toBeNull();
      });

      it('should have 8 available themes including premium themes', () => {
        expect(limits.availableThemes).toHaveLength(8);
        expect(limits.availableThemes).toContain('academic');
        expect(limits.availableThemes).toContain('professional');
        expect(limits.availableThemes).toContain('elegant');
        expect(limits.availableThemes).toContain('modern');
        expect(limits.availableThemes).toContain('newsletter');
      });

      it('should allow custom CSS', () => {
        expect(limits.customCssAllowed).toBe(true);
      });

      it('should have 1 GB cloud storage', () => {
        expect(limits.cloudStorageBytes).toBe(1024 * 1024 * 1024);
      });
    });

    describe('Team Plan', () => {
      const limits = PLANS.team.limits;

      it('should have unlimited conversions per day', () => {
        expect(limits.conversionsPerDay).toBe(Infinity);
      });

      it('should have 20 MB max file size', () => {
        expect(limits.maxFileSize).toBe(20 * 1024 * 1024);
      });

      it('should have 10000 API calls per day', () => {
        expect(limits.apiCallsPerDay).toBe(10000);
      });

      it('should have 200 max batch files', () => {
        expect(limits.maxBatchFiles).toBe(200);
      });

      it('should allow 5 team members', () => {
        expect(limits.teamMembersAllowed).toBe(5);
      });

      it('should have priority rendering', () => {
        expect(limits.priorityRendering).toBe(true);
      });
    });

    describe('Enterprise Plan', () => {
      const limits = PLANS.enterprise.limits;

      it('should have unlimited conversions per day', () => {
        expect(limits.conversionsPerDay).toBe(Infinity);
      });

      it('should have 100 MB max file size', () => {
        expect(limits.maxFileSize).toBe(100 * 1024 * 1024);
      });

      it('should have 100000 API calls per day', () => {
        expect(limits.apiCallsPerDay).toBe(100000);
      });

      it('should have unlimited batch files', () => {
        expect(limits.maxBatchFiles).toBe(Infinity);
      });

      it('should allow unlimited team members', () => {
        expect(limits.teamMembersAllowed).toBe(Infinity);
      });

      it('should have unlimited cloud storage', () => {
        expect(limits.cloudStorageBytes).toBe(Infinity);
      });

      it('should have priority support', () => {
        expect(limits.supportLevel).toBe('priority');
      });
    });
  });

  describe('getPlanLimits', () => {
    it('should return limits for free plan', () => {
      const limits = getPlanLimits('free');
      expect(limits.conversionsPerDay).toBe(20);
    });

    it('should return limits for pro plan', () => {
      const limits = getPlanLimits('pro');
      expect(limits.conversionsPerDay).toBe(500);
    });

    it('should return limits for team plan', () => {
      const limits = getPlanLimits('team');
      expect(limits.conversionsPerDay).toBe(Infinity);
    });

    it('should return limits for enterprise plan', () => {
      const limits = getPlanLimits('enterprise');
      expect(limits.apiCallsPerDay).toBe(100000);
    });
  });

  describe('getPlan', () => {
    it('should return full plan object', () => {
      const plan = getPlan('pro');
      expect(plan.id).toBe('pro');
      expect(plan.name).toBe('Pro');
      expect(plan.priceMonthly).toBe(5);
      expect(plan.limits).toBeDefined();
    });
  });

  describe('isThemeAvailable', () => {
    it('should return true for available theme on free plan', () => {
      expect(isThemeAvailable('free', 'github')).toBe(true);
      expect(isThemeAvailable('free', 'minimal')).toBe(true);
      expect(isThemeAvailable('free', 'dark')).toBe(true);
    });

    it('should return false for unavailable theme on free plan', () => {
      expect(isThemeAvailable('free', 'academic')).toBe(false);
      expect(isThemeAvailable('free', 'professional')).toBe(false);
    });

    it('should return true for all themes on pro plan', () => {
      expect(isThemeAvailable('pro', 'github')).toBe(true);
      expect(isThemeAvailable('pro', 'academic')).toBe(true);
      expect(isThemeAvailable('pro', 'professional')).toBe(true);
    });

    it('should return false for non-existent theme', () => {
      expect(isThemeAvailable('enterprise', 'non-existent')).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(500 * 1024)).toBe('500 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should return "Unlimited" for Infinity', () => {
      expect(formatFileSize(Infinity)).toBe('Unlimited');
    });

    it('should return "0 B" for zero', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });
});
