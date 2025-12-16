import { z } from 'zod';

/**
 * API request validation schemas using Zod
 */

// Document themes enum
const documentThemeSchema = z.enum([
  'github',
  'academic',
  'minimal',
  'dark',
  'professional',
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
