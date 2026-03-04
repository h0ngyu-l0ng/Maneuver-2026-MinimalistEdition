/**
 * Pit Assignment Transfer - Legacy Compatibility Wrapper
 *
 * This file maintains backward compatibility by re-exporting the modular utilities
 * from the new `pitAssignments/` directory structure.
 *
 * ## Migration Guide
 *
 * Old imports:
 * ```typescript
 * import { loadPitAssignmentsForEvent, normalizeScoutName } from '@/core/lib/pitAssignmentTransfer';
 * ```
 *
 * Now route through modular submodules for better tree-shaking and encapsulation:
 * ```typescript
 * import { loadPitAssignmentsForEvent } from '@/core/lib/pitAssignments/assignmentLoading';
 * import { normalizeScoutName } from '@/core/lib/pitAssignments/scoutNameNormalization';
 * // OR use the index for convenience:
 * import { loadPitAssignmentsForEvent, normalizeScoutName } from '@/core/lib/pitAssignments';
 * ```
 *
 * This file will be deprecated in Phase 2 when extracted to npm packages.
 */

// Main transfer functionality
export {
  buildPitAssignmentsTransferPayload,
  hasPitAssignmentImportConflict,
  importPitAssignmentsPayload,
  markPitAssignmentCompleted,
  type PitAssignmentTransferPayload,
  type PitAssignmentImportStrategy,
  type PitAssignmentImportResult,
} from './pitAssignments';

// Commonly used utilities (re-exported for convenience)
export {
  normalizeScoutName,
} from './pitAssignments/scoutNameNormalization';

export {
  getPitAssignmentsStorageKey,
  getMatchAssignmentsStorageKey,
  getPitAssignmentsMetaKey,
  getPitAssignmentsMineKey,
} from './pitAssignments/storageKeys';

export {
  loadPitAssignmentsForEvent,
  loadMatchAssignmentsForEvent,
  loadMyPitAssignments,
  savePitAssignmentsForEvent,
  saveMatchAssignmentsForEvent,
  getPitAssignmentMeta,
} from './pitAssignments/assignmentLoading';

export {
  buildAssignmentIdentity,
  mergeAssignments,
} from './pitAssignments/assignmentMerging';

export {
  isPitAssignmentImportStrategy,
  detectImportConflict,
  resolveImportStrategy,
  scopeAssignmentsToScout,
} from './pitAssignments/importStrategy';

