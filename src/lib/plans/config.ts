/**
 * Plan configuration and limits for the freemium model
 */

export type PlanType = 'free' | 'pro' | 'team' | 'enterprise';

export interface PlanLimits {
  /** Daily conversion limit */
  conversionsPerDay: number;
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Daily API calls limit */
  apiCallsPerDay: number;
  /** Maximum files in batch conversion */
  maxBatchFiles: number;
  /** Available document themes */
  availableThemes: string[];
  /** Whether watermark is shown */
  hasWatermark: boolean;
  /** Watermark text (if any) */
  watermarkText: string | null;
  /** Support level */
  supportLevel: 'community' | 'email-48h' | 'email-24h' | 'priority';
  /** Custom CSS allowed */
  customCssAllowed: boolean;
  /** Custom headers/footers allowed */
  customHeaderFooter: boolean;
  /** Cloud storage in bytes (0 = none) */
  cloudStorageBytes: number;
  /** Team members allowed (0 = individual only) */
  teamMembersAllowed: number;
  /** Priority rendering (faster processing) */
  priorityRendering: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
}

/**
 * Plan configurations with all limits
 */
export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      conversionsPerDay: 20,
      maxFileSize: 500 * 1024, // 500 KB
      apiCallsPerDay: 100,
      maxBatchFiles: 5,
      availableThemes: ['github', 'minimal', 'dark'],
      hasWatermark: true,
      watermarkText: 'Made with MD2PDF',
      supportLevel: 'community',
      customCssAllowed: false,
      customHeaderFooter: false,
      cloudStorageBytes: 0,
      teamMembersAllowed: 0,
      priorityRendering: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 5,
    priceYearly: 48, // 20% discount
    limits: {
      conversionsPerDay: 500,
      maxFileSize: 5 * 1024 * 1024, // 5 MB
      apiCallsPerDay: 2000,
      maxBatchFiles: 50,
      availableThemes: [
        'github',
        'minimal',
        'dark',
        'academic',
        'professional',
        'elegant',
        'modern',
        'newsletter',
      ],
      hasWatermark: false,
      watermarkText: null,
      supportLevel: 'email-48h',
      customCssAllowed: true,
      customHeaderFooter: true,
      cloudStorageBytes: 1024 * 1024 * 1024, // 1 GB
      teamMembersAllowed: 0,
      priorityRendering: false,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    priceMonthly: 15,
    priceYearly: 144, // 20% discount
    limits: {
      conversionsPerDay: Infinity,
      maxFileSize: 20 * 1024 * 1024, // 20 MB
      apiCallsPerDay: 10000,
      maxBatchFiles: 200,
      availableThemes: [
        'github',
        'minimal',
        'dark',
        'academic',
        'professional',
        'elegant',
        'modern',
        'newsletter',
      ],
      hasWatermark: false,
      watermarkText: null,
      supportLevel: 'email-24h',
      customCssAllowed: true,
      customHeaderFooter: true,
      cloudStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      teamMembersAllowed: 5,
      priorityRendering: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 99,
    priceYearly: 948, // 20% discount
    limits: {
      conversionsPerDay: Infinity,
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      apiCallsPerDay: 100000,
      maxBatchFiles: Infinity,
      availableThemes: [
        'github',
        'minimal',
        'dark',
        'academic',
        'professional',
        'elegant',
        'modern',
        'newsletter',
      ],
      hasWatermark: false,
      watermarkText: null,
      supportLevel: 'priority',
      customCssAllowed: true,
      customHeaderFooter: true,
      cloudStorageBytes: Infinity,
      teamMembersAllowed: Infinity,
      priorityRendering: true,
    },
  },
};

/**
 * Cache TTL for plan limits (1 hour in milliseconds)
 * Used to prepare for future database-backed plan configurations
 */
const PLAN_LIMITS_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * In-memory cache for plan limits
 * Provides caching layer for potential future database-backed configs
 */
const planLimitsCache = new Map<string, { limits: PlanLimits; expires: number }>();

/**
 * Get plan limits by plan type
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
  return PLANS[planType].limits;
}

/**
 * Get cached plan limits with TTL
 * Uses in-memory cache to reduce lookups in hot paths
 * Prepares for future database-backed plan configurations
 */
export function getCachedPlanLimits(planType: PlanType): PlanLimits {
  const cached = planLimitsCache.get(planType);
  const now = Date.now();

  if (cached && cached.expires > now) {
    return cached.limits;
  }

  const limits = getPlanLimits(planType);
  planLimitsCache.set(planType, {
    limits,
    expires: now + PLAN_LIMITS_CACHE_TTL_MS,
  });

  return limits;
}

/**
 * Clear the plan limits cache
 * Useful for testing or when plan configurations are updated
 */
export function clearPlanLimitsCache(): void {
  planLimitsCache.clear();
}

/**
 * Get plan configuration by plan type
 */
export function getPlan(planType: PlanType): Plan {
  return PLANS[planType];
}

/**
 * Check if a theme is available for a plan
 */
export function isThemeAvailable(planType: PlanType, theme: string): boolean {
  return PLANS[planType].limits.availableThemes.includes(theme);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === Infinity) return 'Unlimited';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
