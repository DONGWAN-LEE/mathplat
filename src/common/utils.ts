/**
 * Common Utility Functions
 *
 * Provides utility functions used across the application.
 * Based on ARCHITECTURE.md utility requirements.
 */

import * as crypto from 'crypto';

/**
 * Creates a SHA-256 hash of the input string
 * Used for token hashing and secure comparisons
 *
 * @param input - The string to hash
 * @returns The hexadecimal hash string
 */
export function sha256Hash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generates a cryptographically secure random string
 *
 * @param length - The length of the string to generate
 * @returns A random hexadecimal string
 */
export function generateSecureRandomString(length = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Safely compares two strings in constant time to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Checks if a string is a valid UUID v4
 *
 * @param uuid - The string to validate
 * @returns True if the string is a valid UUID v4
 */
export function isValidUuid(uuid: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
}

/**
 * Masks sensitive data for logging purposes
 *
 * @param value - The value to mask
 * @param visibleChars - Number of characters to keep visible at start and end
 * @returns Masked string
 */
export function maskSensitiveData(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars * 2, 10));
  return `${start}${masked}${end}`;
}

/**
 * Parses a boolean environment variable
 *
 * @param value - The string value to parse
 * @param defaultValue - Default value if parsing fails
 * @returns The parsed boolean value
 */
export function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Hashes a password using Node.js native scrypt with random salt
 *
 * Produces a salt:hash formatted string suitable for secure password storage.
 * Uses 64-byte key length with cryptographically random 16-byte salt.
 *
 * @param password - The plaintext password to hash
 * @returns The salt:hash formatted string
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored scrypt hash
 *
 * @param password - The plaintext password to verify
 * @param stored - The stored salt:hash string from hashPassword()
 * @returns True if the password matches
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return constantTimeCompare(hash, testHash);
}

/**
 * Sleep utility for async operations
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
