/**
 * Pit Assignment Loading & Saving
 *
 * Read/write pit and match assignments to/from localStorage.
 */

import type { PitAssignment, MatchAssignment } from '@/core/lib/pitAssignmentTypes';
import { parseJson } from './parseJson';
import { normalizeScoutName } from './scoutNameNormalization';
import {
  getPitAssignmentsStorageKey,
  getMatchAssignmentsStorageKey,
  getPitAssignmentsMineKey,
  getPitAssignmentsMetaKey,
} from './storageKeys';

interface PitAssignmentMeta {
  lastSyncedAt: number;
  sourceScoutName: string;
  strategy: 'replace' | 'merge';
}

/**
 * Load all pit assignments for an event
 * @param eventKey - Event identifier
 * @returns Array of PitAssignment (empty if none found)
 */
export const loadPitAssignmentsForEvent = (eventKey: string): PitAssignment[] => {
  return parseJson<PitAssignment[]>(
    localStorage.getItem(getPitAssignmentsStorageKey(eventKey)),
    []
  );
};

/**
 * Load all match assignments for an event
 * @param eventKey - Event identifier
 * @returns Array of MatchAssignment (empty if none found)
 */
export const loadMatchAssignmentsForEvent = (eventKey: string): MatchAssignment[] => {
  return parseJson<MatchAssignment[]>(
    localStorage.getItem(getMatchAssignmentsStorageKey(eventKey)),
    []
  );
};

/**
 * Load assignments scoped to current scout
 * Falls back to full event assignments if individual assignment not found
 * @param eventKey - Event identifier
 * @param scoutName - Scout name (will be normalized)
 * @returns Array of PitAssignment relevant to scout
 */
export const loadMyPitAssignments = (eventKey: string, scoutName: string): PitAssignment[] => {
  const normalizedScoutName = normalizeScoutName(scoutName);
  if (!normalizedScoutName) return [];

  const mineKey = getPitAssignmentsMineKey(eventKey, normalizedScoutName);
  const storedMine = parseJson<PitAssignment[]>(localStorage.getItem(mineKey), []);

  if (storedMine.length > 0) {
    return storedMine;
  }

  const matchedAssignments = loadPitAssignmentsForEvent(eventKey).filter(
    (assignment) => normalizeScoutName(assignment.scoutName) === normalizedScoutName
  );

  if (matchedAssignments.length > 0) {
    return matchedAssignments;
  }

  return loadPitAssignmentsForEvent(eventKey);
};

/**
 * Save pit assignments to localStorage
 * @param eventKey - Event identifier
 * @param assignments - Array of assignments to save
 */
export const savePitAssignmentsForEvent = (eventKey: string, assignments: PitAssignment[]): void => {
  localStorage.setItem(getPitAssignmentsStorageKey(eventKey), JSON.stringify(assignments));
};

/**
 * Save match assignments to localStorage
 * @param eventKey - Event identifier
 * @param assignments - Array of match assignments to save
 */
export const saveMatchAssignmentsForEvent = (eventKey: string, assignments: MatchAssignment[]): void => {
  localStorage.setItem(getMatchAssignmentsStorageKey(eventKey), JSON.stringify(assignments));
};

/**
 * Save metadata about the last sync
 * @internal
 */
export const storePitAssignmentMeta = (eventKey: string, meta: PitAssignmentMeta): void => {
  localStorage.setItem(getPitAssignmentsMetaKey(eventKey), JSON.stringify(meta));
};

/**
 * Save assignments scoped to a specific scout
 * @internal
 */
export const storeMineAssignments = (eventKey: string, scoutName: string, assignments: PitAssignment[]): void => {
  const normalizedScoutName = normalizeScoutName(scoutName);
  if (!normalizedScoutName) return;

  const mineKey = getPitAssignmentsMineKey(eventKey, normalizedScoutName);
  localStorage.setItem(mineKey, JSON.stringify(assignments));
};

/**
 * Load metadata about the last sync
 * @param eventKey - Event identifier
 * @returns Metadata or null if never synced
 */
export const getPitAssignmentMeta = (eventKey: string): { lastSyncedAt: number; sourceScoutName: string } | null => {
  const raw = parseJson<PitAssignmentMeta | null>(localStorage.getItem(getPitAssignmentsMetaKey(eventKey)), null);
  if (!raw) return null;
  return {
    lastSyncedAt: raw.lastSyncedAt,
    sourceScoutName: raw.sourceScoutName,
  };
};
