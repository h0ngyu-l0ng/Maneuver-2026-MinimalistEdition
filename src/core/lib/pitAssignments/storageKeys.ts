/**
 * Pit Assignment Storage Key Generation
 *
 * Centralizes all localStorage key generation for pit and match assignments.
 * Single source of truth for storage naming conventions.
 */

const PIT_ASSIGNMENTS_KEY_PREFIX = 'pit_assignments_';
const MATCH_ASSIGNMENTS_KEY_PREFIX = 'match_assignments_';
const PIT_ASSIGNMENTS_META_KEY_PREFIX = 'pit_assignments_meta_';
const PIT_ASSIGNMENTS_MINE_KEY_PREFIX = 'pit_assignments_mine_';

/**
 * Generate storage key for all pit assignments for an event
 * @param eventKey - Unique event identifier
 * @returns Storage key (e.g., "pit_assignments_2024cama")
 */
export const getPitAssignmentsStorageKey = (eventKey: string): string =>
  `${PIT_ASSIGNMENTS_KEY_PREFIX}${eventKey}`;

/**
 * Generate storage key for all match assignments for an event
 * @param eventKey - Unique event identifier
 * @returns Storage key (e.g., "match_assignments_2024cama")
 */
export const getMatchAssignmentsStorageKey = (eventKey: string): string =>
  `${MATCH_ASSIGNMENTS_KEY_PREFIX}${eventKey}`;

/**
 * Generate storage key for pit assignment metadata
 * @param eventKey - Unique event identifier
 * @returns Storage key for sync metadata
 */
export const getPitAssignmentsMetaKey = (eventKey: string): string =>
  `${PIT_ASSIGNMENTS_META_KEY_PREFIX}${eventKey}`;

/**
 * Generate storage key for a specific scout's assignments
 * @param eventKey - Unique event identifier
 * @param normalizedScoutName - Pre-normalized scout name (lowercase)
 * @returns Storage key scoped to one scout (e.g., "pit_assignments_mine_2024cama_alice")
 */
export const getPitAssignmentsMineKey = (eventKey: string, normalizedScoutName: string): string =>
  `${PIT_ASSIGNMENTS_MINE_KEY_PREFIX}${eventKey}_${normalizedScoutName}`;
