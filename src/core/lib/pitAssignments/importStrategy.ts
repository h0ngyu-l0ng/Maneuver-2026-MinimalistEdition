/**
 * Pit Assignment Import Strategy
 *
 * Handles import logic: strategy selection, validation, conflict detection.
 */

import type { PitAssignment } from '@/core/lib/pitAssignmentTypes';
import { normalizeScoutName } from './scoutNameNormalization';
import { loadPitAssignmentsForEvent } from './assignmentLoading';

/** Import strategy for resolving conflicts between existing and incoming assignments */
export type PitAssignmentImportStrategy = 'replace' | 'merge' | 'cancel';

/**
 * Check if value is a valid import strategy
 * @internal
 */
export const isPitAssignmentImportStrategy = (value: unknown): value is PitAssignmentImportStrategy =>
  value === 'replace' || value === 'merge' || value === 'cancel';

/**
 * Detect if there would be a conflict when importing
 * Used to prompt user for strategy choice
 * @param existingAssignments - Current assignments
 * @param incomingAssignments - Assignments to import
 * @returns True if both sets are non-empty (conflict exists)
 */
export const detectImportConflict = (
  existingAssignments: PitAssignment[],
  incomingAssignments: PitAssignment[]
): boolean =>
  existingAssignments.length > 0 && incomingAssignments.length > 0;

/**
 * Resolve import strategy based on data or user override
 * @param existing - Current assignments
 * @param incoming - New assignments
 * @param strategyOverride - User-provided strategy (if any)
 * @returns Resolved strategy: 'replace' | 'merge' | 'cancel'
 */
export const resolveImportStrategy = (
  existing: PitAssignment[],
  incoming: PitAssignment[],
  strategyOverride?: PitAssignmentImportStrategy
): PitAssignmentImportStrategy => {
  // User explicitly chose a strategy
  if (isPitAssignmentImportStrategy(strategyOverride)) {
    return strategyOverride;
  }

  // Auto-choose strategy
  if (existing.length === 0) {
    return 'replace'; // No conflict, just import
  }

  if (incoming.length === 0) {
    return 'cancel'; // Nothing to import
  }

  // Both have data → ask user to merge
  return 'merge';
};

/**
 * Calculate which scout assignments to scope to for a receiving scout
 * Returns personal assignments if they exist, otherwise returns all
 * @internal
 */
export const scopeAssignmentsToScout = (
  assignments: PitAssignment[],
  currentScoutName: string
): PitAssignment[] => {
  const normalizedCurrent = normalizeScoutName(currentScoutName);
  const myAssignments = assignments.filter(
    (a) => normalizeScoutName(a.scoutName) === normalizedCurrent
  );
  return myAssignments.length > 0 ? myAssignments : assignments;
};
