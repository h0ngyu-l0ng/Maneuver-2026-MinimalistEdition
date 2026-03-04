/**
 * Scout Name Normalization Utilities
 *
 * Handles consistent normalization of scout names for comparison and storage.
 * Removes parenthetical notes and normalizes whitespace.
 */

/**
 * Normalize a scout name for consistent comparison and storage
 * @param name - Raw scout name (may contain parenthetical notes)
 * @returns Normalized name (trimmed, lowercase, no parenthetical notes)
 * @example
 * normalizeScoutName("Alice (Lead)")  // => "alice"
 * normalizeScoutName("  Bob  ")       // => "bob"
 */
export const normalizeScoutName = (name: string): string => {
  return name
    .trim()
    .replace(/\s*\([^)]*\)\s*$/, '')  // Remove trailing parenthetical
    .replace(/\s+/g, ' ')              // Normalize internal whitespace
    .toLowerCase();
};
