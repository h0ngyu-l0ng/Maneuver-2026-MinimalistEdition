/**
 * Pit Assignment Transfer & Sync
 *
 * Orchestrates WiFi sync of pit and match assignments between scouts.
 * Coordinates loading, merging, strategy selection, and persistence.
 *
 * ## Architecture
 *
 * Broken into modular utilities for clarity:
 * - `scoutNameNormalization.ts` - Scout name consistency
 * - `storageKeys.ts` - localStorage key generation
 * - `parseJson.ts` - Safe JSON parsing
 * - `assignmentLoading.ts` - Load/save operations
 * - `assignmentMerging.ts` - Deduplication logic
 * - `importStrategy.ts` - Conflict resolution
 *
 * ## Usage
 *
 * ```typescript
 * // Build a payload to push to connected scouts
 * const payload = buildPitAssignmentsTransferPayload(eventKey, 'lead-scout');
 * pushDataToAll(payload, 'pit-assignments');
 *
 * // Receive and import on connected scout
 * const result = importPitAssignmentsPayload(payload, 'scout-a', 'merge');
 * ```
 */

import type { PitAssignment, MatchAssignment } from '@/core/lib/pitAssignmentTypes';
import {
  loadPitAssignmentsForEvent,
  loadMatchAssignmentsForEvent,
  savePitAssignmentsForEvent,
  saveMatchAssignmentsForEvent,
  storePitAssignmentMeta,
  storeMineAssignments,
   getPitAssignmentMeta,
} from './assignmentLoading';
import {
  mergeAssignments,
} from './assignmentMerging';
import {
  isPitAssignmentImportStrategy,
  detectImportConflict,
  resolveImportStrategy,
  scopeAssignmentsToScout,
} from './importStrategy';
import { normalizeScoutName } from './scoutNameNormalization';

export interface PitAssignmentTransferPayload {
  eventKey: string;
  sourceScoutName: string;
  generatedAt: number;
  assignments: PitAssignment[];
  matchAssignments?: MatchAssignment[];
}

export type PitAssignmentImportStrategy = 'replace' | 'merge' | 'cancel';

export interface PitAssignmentImportResult {
  strategy: PitAssignmentImportStrategy;
  importedCount: number;
  mergedCount: number;
  skippedCount: number;
}

/**
 * Build a transfer payload to push to connected scouts
 * Includes both pit and match assignments for the event
 * @param eventKey - Event identifier
 * @param sourceScoutName - Scout initiating the push
 * @returns Complete payload ready for WiFi transfer
 */
export const buildPitAssignmentsTransferPayload = (
  eventKey: string,
  sourceScoutName: string,
): PitAssignmentTransferPayload => ({
  eventKey,
  sourceScoutName,
  generatedAt: Date.now(),
  assignments: loadPitAssignmentsForEvent(eventKey),
  matchAssignments: loadMatchAssignmentsForEvent(eventKey),
});

/**
 * Check if importing would cause a conflict
 * @param payload - Incoming payload
 * @returns True if there are existing assignments (will need strategy)
 */
export const hasPitAssignmentImportConflict = (payload: PitAssignmentTransferPayload): boolean => {
  const existingAssignments = loadPitAssignmentsForEvent(payload.eventKey);
  return detectImportConflict(existingAssignments, payload.assignments);
};

/**
 * Import a complete assignment payload
 * Handles strategy selection, merging, and persistence
 * @param payload - Incoming payload from WiFi transfer
 * @param currentScoutName - Scout receiving the import
 * @param strategyOverride - User strategy choice (optional, auto-selected if not provided)
 * @returns Result details: strategy used, counts, etc.
 */
export const importPitAssignmentsPayload = (
  payload: PitAssignmentTransferPayload,
  currentScoutName: string,
  strategyOverride?: PitAssignmentImportStrategy,
): PitAssignmentImportResult => {
  const existingAssignments = loadPitAssignmentsForEvent(payload.eventKey);
  const strategy = resolveImportStrategy(existingAssignments, payload.assignments, strategyOverride);

  if (strategy === 'cancel') {
    return {
      strategy,
      importedCount: 0,
      mergedCount: 0,
      skippedCount: payload.assignments.length,
    };
  }

  // Determine final assignments based on strategy
  const nextAssignments = strategy === 'replace'
    ? [...payload.assignments]
    : mergeAssignments(existingAssignments, payload.assignments);

  // Sync event context on receiving scout
  if (payload.eventKey?.trim()) {
    localStorage.setItem('eventKey', payload.eventKey);
    localStorage.setItem('eventName', payload.eventKey);
  }

  // Persist pit assignments
  savePitAssignmentsForEvent(payload.eventKey, nextAssignments);

  // Persist match assignments if present
  if (payload.matchAssignments && payload.matchAssignments.length > 0) {
    saveMatchAssignmentsForEvent(payload.eventKey, payload.matchAssignments);
  }

  // Scope to current scout and store personal copy
  const scopedAssignments = scopeAssignmentsToScout(nextAssignments, currentScoutName);
  storeMineAssignments(payload.eventKey, currentScoutName, scopedAssignments);

  // Record sync metadata
  storePitAssignmentMeta(payload.eventKey, {
    lastSyncedAt: Date.now(),
    sourceScoutName: payload.sourceScoutName,
    strategy,
  });

  return {
    strategy,
    importedCount: scopedAssignments.length,
    mergedCount: strategy === 'merge' ? nextAssignments.length : 0,
    skippedCount: strategy === 'replace' ? 0 : Math.max(0, existingAssignments.length - payload.assignments.length),
  };
};

/**
 * Mark a specific pit assignment as completed
 * @param eventKey - Event identifier
 * @param scoutName - Scout name
 * @param teamNumber - Team being scouted
 * @returns True if update was made, false if assignment not found
 */
export const markPitAssignmentCompleted = (
  eventKey: string,
  scoutName: string,
  teamNumber: number,
): boolean => {
  const allAssignments = loadPitAssignmentsForEvent(eventKey);
  let updated = false;

  const nextAssignments = allAssignments.map((assignment) => {
    const isTarget = assignment.teamNumber === teamNumber
      && assignment.scoutName.toLowerCase() === scoutName.toLowerCase();

    if (!isTarget || assignment.completed) {
      return assignment;
    }

    updated = true;
    return {
      ...assignment,
      completed: true,
    };
  });

  if (!updated) {
    return false;
  }

  savePitAssignmentsForEvent(eventKey, nextAssignments);

  // Update personal copy
  const myAssignments = scopeAssignmentsToScout(nextAssignments, scoutName);
  storeMineAssignments(eventKey, scoutName, myAssignments);

  return true;
};

// Re-export commonly used utilities
export { normalizeScoutName };
export {
  loadPitAssignmentsForEvent,
  loadMatchAssignmentsForEvent,
  loadMyPitAssignments,
} from './assignmentLoading';
export { buildAssignmentIdentity } from './assignmentMerging';
export type { PitAssignmentImportStrategy } from './importStrategy';
export { getPitAssignmentMeta } from './assignmentLoading';
