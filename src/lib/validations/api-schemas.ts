import { z } from 'zod';

/**
 * API request validation schemas using Zod
 *
 * Centralized validation schemas for:
 * - API requests
 * - Common data types (email, ObjectId, pagination)
 * - File operations
 * - User data
 */

// =============================================================================
// Common Schemas
// =============================================================================

/**
 * MongoDB ObjectId validation
 * Validates 24-character hexadecimal string
 */
export const mongoIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

/**
 * Email schema with normalization
 * Trims whitespace before validation
 */
export const emailSchema = z
  .string()
  .transform((e) => e.trim().toLowerCase())
  .pipe(
    z.string()
      .email('Invalid email address')
      .max(255, 'Email too long')
  );

/**
 * User name schema
 * Trims whitespace and rejects empty strings
 */
export const userNameSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(
    z.string()
      .min(1, 'Name is required')
      .max(100, 'Name too long')
  );

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Safe filename schema
 * Removes potentially dangerous characters
 */
export const filenameSchema = z
  .string()
  .min(1, 'Filename is required')
  .max(255, 'Filename too long')
  .transform((name) => {
    // Remove path traversal and dangerous characters
    return name
      .replace(/\.\./g, '') // Remove path traversal
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Remove dangerous chars
      .replace(/^\.+/, '') // Remove leading dots
      .trim();
  })
  .refine((name) => name.length > 0, 'Invalid filename');

/**
 * URL schema for safe URLs (http/https only)
 */
export const safeUrlSchema = z
  .string()
  .url('Invalid URL')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use http or https protocol');

/**
 * Safe string schema that removes angle brackets (basic XSS prevention)
 */
export const safeStringSchema = z
  .string()
  .transform((s) => s.replace(/[<>]/g, '').trim());

/**
 * Metadata schema for analytics - allow only safe primitive values
 */
export const safeMetadataSchema = z
  .record(
    z.union([
      z.string().max(500),
      z.number(),
      z.boolean(),
      z.null(),
    ])
  )
  .optional()
  .refine(
    (obj) => !obj || Object.keys(obj).length <= 20,
    'Too many metadata fields (max 20)'
  );

// =============================================================================
// Theme Schemas
// =============================================================================

// Document themes enum
const documentThemeSchema = z.enum([
  'github',
  'academic',
  'minimal',
  'dark',
  'professional',
  'elegant',
  'modern',
  'newsletter',
]);

// Code themes enum
const codeThemeSchema = z.enum([
  'github-dark',
  'github-light',
  'monokai',
  'dracula',
  'nord',
  'one-dark',
  'vs-code',
]);

// Page size enum
const pageSizeSchema = z.enum(['a4', 'letter', 'legal', 'a3', 'custom']);

// Orientation enum
const orientationSchema = z.enum(['portrait', 'landscape']);

// Page number position enum
const pageNumberPositionSchema = z.enum([
  'bottom-center',
  'bottom-right',
  'bottom-left',
  'top-center',
  'top-right',
]);

// Page margins schema
const pageMarginsSchema = z.object({
  top: z.number().min(0).max(100).default(20),
  bottom: z.number().min(0).max(100).default(20),
  left: z.number().min(0).max(100).default(20),
  right: z.number().min(0).max(100).default(20),
});

// Header/Footer schema
const headerFooterSchema = z.object({
  showHeader: z.boolean().default(false),
  showFooter: z.boolean().default(false),
  headerText: z.string().max(500).default(''),
  footerText: z.string().max(500).default(''),
});

// Page numbers schema
const pageNumbersSchema = z.object({
  show: z.boolean().default(true),
  position: pageNumberPositionSchema.default('bottom-center'),
});

// Watermark schema
const watermarkSchema = z.object({
  show: z.boolean().default(false),
  text: z.string().max(100).default(''),
  opacity: z.number().min(0).max(1).default(0.1),
});

// Page settings schema
const pageSettingsSchema = z.object({
  pageSize: pageSizeSchema.default('a4'),
  orientation: orientationSchema.default('portrait'),
  margins: pageMarginsSchema.optional(),
  customWidth: z.number().min(50).max(1000).optional(),
  customHeight: z.number().min(50).max(1000).optional(),
  headerFooter: headerFooterSchema.optional(),
  pageNumbers: pageNumbersSchema.optional(),
  watermark: watermarkSchema.optional(),
});

/**
 * Schema for /api/convert endpoint
 */
export const convertRequestSchema = z.object({
  markdown: z
    .string()
    .min(1, 'Content is required')
    .max(1000000, 'Content exceeds maximum length of 1MB'),
  theme: documentThemeSchema.optional().default('github'),
  codeTheme: codeThemeSchema.optional().default('github-light'),
  pageSettings: pageSettingsSchema.optional(),
  customCss: z
    .string()
    .max(50000, 'Custom CSS exceeds maximum length')
    .optional()
    .default(''),
});

export type ConvertRequest = z.infer<typeof convertRequestSchema>;

/**
 * Schema for /api/preview endpoint
 */
export const previewRequestSchema = z.object({
  markdown: z
    .string()
    .min(1, 'Content is required')
    .max(1000000, 'Content exceeds maximum length of 1MB'),
  theme: documentThemeSchema.optional().default('github'),
});

export type PreviewRequest = z.infer<typeof previewRequestSchema>;

/**
 * Schema for batch item
 */
const batchItemSchema = z.object({
  id: z.string().min(1, 'ID is required').max(100),
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255)
    .regex(/^[^<>:"/\\|?*]+$/, 'Invalid filename characters'),
  markdown: z
    .string()
    .min(1, 'Content is required')
    .max(500000, 'Single file content exceeds maximum length'),
});

/**
 * Schema for /api/convert/batch endpoint
 */
export const batchRequestSchema = z.object({
  files: z
    .array(batchItemSchema)
    .min(1, 'At least one file is required')
    .max(20, 'Maximum 20 files allowed'),
  theme: documentThemeSchema.optional().default('github'),
  codeTheme: codeThemeSchema.optional().default('github-light'),
  pageSettings: pageSettingsSchema.optional(),
});

export type BatchRequest = z.infer<typeof batchRequestSchema>;

/**
 * Helper function to validate request body
 * Returns { success: true, data } or { success: false, error }
 */
export function validateRequest<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format error message
  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, error: errors.join(', ') };
}
