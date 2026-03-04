/**
 * Pit Assignment Merging & Identity
 *
 * Deduplicate and merge assignments by identity (event + team + scout).
 */

import type { PitAssignment } from '@/core/lib/pitAssignmentTypes';
import { normalizeScoutName } from './scoutNameNormalization';

/**
 * Build unique identity for an assignment
 * Used as deduplication key when merging assignments from multiple sources
 * @param assignment - Assignment to identify
 * @returns Unique identifier (id or derived from event:team:scout)
 */
export const buildAssignmentIdentity = (assignment: PitAssignment): string =>
  assignment.id || `${assignment.eventKey}:${assignment.teamNumber}:${normalizeScoutName(assignment.scoutName)}`;

/**
 * Merge two assignment lists, deduplicating by identity
 * Newer incoming assignments override existing ones
 * @param existing - Current assignments
 * @param incoming - New assignments to merge
 * @returns Merged array sorted by team number, with duplicates removed
 * @example
 * const merged = mergeAssignments(
 *   [{id: '1', teamNumber: 1, scoutName: 'Alice'}],
 *   [{id: '1', teamNumber: 1, scoutName: 'Alice'}]
 * );
 * // Returns single assignment (deduped)
 */
export const mergeAssignments = (existing: PitAssignment[], incoming: PitAssignment[]): PitAssignment[] => {
  const byIdentity = new Map<string, PitAssignment>();

  // Load existing assignments into map
  existing.forEach((assignment) => {
    byIdentity.set(buildAssignmentIdentity(assignment), assignment);
  });

  // Overlay incoming assignments (newer data wins)
  incoming.forEach((assignment) => {
    byIdentity.set(buildAssignmentIdentity(assignment), assignment);
  });

  // Return deduplicated, sorted result
  return Array.from(byIdentity.values()).sort((a, b) => a.teamNumber - b.teamNumber);
};
