/**
 * JSON Parsing Utilities
 *
 * Safe JSON parsing with fallback support for corrupted or missing data.
 */

/**
 * Safely parse JSON with fallback
 * @param raw - Raw JSON string from localStorage (nullable)
 * @param fallback - Value to return if parsing fails or input is null
 * @returns Parsed value or fallback
 * @example
 * const data = parseJson(localStorage.getItem('key'), []);
 * // Returns [] if not found or invalid JSON
 */
export const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn('Failed to parse JSON:', raw);
    return fallback;
  }
};
