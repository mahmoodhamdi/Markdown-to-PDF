/**
 * Password Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  validatePassword,
  getPasswordStrength,
  BCRYPT_ROUNDS,
} from '@/lib/auth/password-validation';

describe('Password Validation', () => {
  describe('passwordSchema', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Short1A');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      const result = passwordSchema.safeParse('lowercase1');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      const result = passwordSchema.safeParse('UPPERCASE1');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      const result = passwordSchema.safeParse('NoNumbers');
      expect(result.success).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      const result = passwordSchema.safeParse('ValidPass1');
      expect(result.success).toBe(false);
    });

    it('should accept valid passwords with all requirements', () => {
      const result = passwordSchema.safeParse('Valid@Pass1');
      expect(result.success).toBe(true);
    });

    it('should accept long passwords with special characters', () => {
      const result = passwordSchema.safeParse('ThisIsAVeryLongPassword123!');
      expect(result.success).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should return valid for correct passwords', () => {
      const result = validatePassword('ValidPass1!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return all errors for completely invalid password', () => {
      const result = validatePassword('abc');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return specific errors for missing requirements', () => {
      const result = validatePassword('lowercase1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).not.toContain('Password must contain at least one lowercase letter');
      expect(result.errors).not.toContain('Password must contain at least one special character');
    });
  });

  describe('getPasswordStrength', () => {
    it('should return weak for short passwords', () => {
      const result = getPasswordStrength('abc');
      expect(result.label).toBe('weak');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should return fair for medium passwords', () => {
      const result = getPasswordStrength('Password');
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('should return good for strong passwords', () => {
      const result = getPasswordStrength('Password123');
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it('should return strong for passwords with special characters', () => {
      const result = getPasswordStrength('Password123!@#');
      expect(result.label).toBe('strong');
      expect(result.score).toBe(4);
    });

    it('should cap score at 4', () => {
      const result = getPasswordStrength('VeryLongPassword123!@#$%^&*()');
      expect(result.score).toBe(4);
    });
  });

  describe('BCRYPT_ROUNDS', () => {
    it('should be 14 for enhanced security', () => {
      expect(BCRYPT_ROUNDS).toBe(14);
    });
  });
});
