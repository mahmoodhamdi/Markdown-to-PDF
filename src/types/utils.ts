/**
 * Type utilities for strict TypeScript
 */

/**
 * Asserts that a value is not null or undefined
 * @throws Error if value is null or undefined
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value is null or undefined');
  }
  return value;
}

/**
 * Type guard to check if a value is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Gets the error message from an unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Type guard for object with property
 */
export function hasProperty<K extends string>(obj: unknown, key: K): obj is { [P in K]: unknown } {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Safely get array element (returns undefined for out of bounds)
 */
export function safeArrayAccess<T>(arr: T[], index: number): T | undefined {
  return arr[index];
}

/**
 * Get array element with assertion
 * @throws Error if index is out of bounds
 */
export function getArrayElement<T>(arr: T[], index: number, message?: string): T {
  const element = arr[index];
  if (element === undefined) {
    throw new Error(message || `Array index ${index} is out of bounds`);
  }
  return element;
}

/**
 * Type guard to check if value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
