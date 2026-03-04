# Pit Assignment Transfer - Modular Architecture

**Status:** ✅ Phase 1 - Modular Utilities Extracted  
**Optimization Level:** High modularity, excellent tree-shaking, clear separation of concerns  
**Date:** 2026-03-04

## Overview

The pit assignment transfer system has been refactored from a monolithic file into **modular, single-responsibility utilities**. This follows the **best practices from [GAME_COMPONENTS.md](../GAME_COMPONENTS.md)** regarding component and utility organization.

## Architecture

Each concern is now in its own file for maximum clarity and reusability:

```
src/core/lib/
├── pitAssignmentTransfer.ts         # ← Main entry point (re-exports, backward compatible)
│
└── pitAssignments/                  # ← Modular utilities directory
    ├── index.ts                     # ← Public API (re-exports all)
    ├── scoutNameNormalization.ts    # Scout name consistency
    ├── storageKeys.ts               # localStorage key generation
    ├── parseJson.ts                 # Safe JSON parsing
    ├── assignmentLoading.ts         # Read/write operations
    ├── assignmentMerging.ts         # Deduplication & merging
    └── importStrategy.ts            # Conflict resolution logic
```

## File Purposes

### 1. **scoutNameNormalization.ts**
Handles scout name consistency for comparison and storage.

**Exports:**
- `normalizeScoutName(name: string): string`

```typescript
import { normalizeScoutName } from '@/core/lib/pitAssignments/scoutNameNormalization';

normalizeScoutName("Alice (Lead)")  // => "alice"
normalizeScoutName("  Bob  ")       // => "bob"
```

### 2. **storageKeys.ts**
Centralizes localStorage key generation—single source of truth for naming conventions.

**Exports:**
- `getPitAssignmentsStorageKey(eventKey: string): string`
- `getMatchAssignmentsStorageKey(eventKey: string): string`
- `getPitAssignmentsMetaKey(eventKey: string): string`
- `getPitAssignmentsMineKey(eventKey: string, normalizedScoutName: string): string`

```typescript
import { getPitAssignmentsStorageKey } from '@/core/lib/pitAssignments/storageKeys';

const key = getPitAssignmentsStorageKey('2024cama');  // => "pit_assignments_2024cama"
```

### 3. **parseJson.ts**
Safe JSON parsing with fallback support for corrupted or missing localStorage data.

**Exports:**
- `parseJson<T>(raw: string | null, fallback: T): T`

```typescript
import { parseJson } from '@/core/lib/pitAssignments/parseJson';

const data = parseJson(localStorage.getItem('key'), []);
// Returns [] if not found or invalid JSON
```

### 4. **assignmentLoading.ts**
Read/write pit and match assignments to/from localStorage.

**Exports:**
- `loadPitAssignmentsForEvent(eventKey: string): PitAssignment[]`
- `loadMatchAssignmentsForEvent(eventKey: string): MatchAssignment[]`
- `loadMyPitAssignments(eventKey: string, scoutName: string): PitAssignment[]`
- `savePitAssignmentsForEvent(eventKey: string, assignments: PitAssignment[]): void`
- `saveMatchAssignmentsForEvent(eventKey: string, assignments: MatchAssignment[]): void`
- `getPitAssignmentMeta(eventKey: string): { lastSyncedAt: number; sourceScoutName: string } | null`

```typescript
import { 
  loadPitAssignmentsForEvent,
  savePitAssignmentsForEvent 
} from '@/core/lib/pitAssignments/assignmentLoading';

const assignments = loadPitAssignmentsForEvent('2024cama');
savePitAssignmentsForEvent('2024cama', updatedAssignments);
```

### 5. **assignmentMerging.ts**
Deduplication and merging by assignment identity.

**Exports:**
- `buildAssignmentIdentity(assignment: PitAssignment): string`
- `mergeAssignments(existing: PitAssignment[], incoming: PitAssignment[]): PitAssignment[]`

```typescript
import { mergeAssignments } from '@/core/lib/pitAssignments/assignmentMerging';

const merged = mergeAssignments(existing, incoming);
// Returns deduplicated array sorted by team number
```

### 6. **importStrategy.ts**
Conflict resolution: strategy selection, validation, and scoping logic.

**Exports:**
- `type PitAssignmentImportStrategy = 'replace' | 'merge' | 'cancel'`
- `isPitAssignmentImportStrategy(value: unknown): boolean`
- `detectImportConflict(existing: PitAssignment[], incoming: PitAssignment[]): boolean`
- `resolveImportStrategy(existing: PitAssignment[], incoming: PitAssignment[], override?: PitAssignmentImportStrategy): PitAssignmentImportStrategy`
- `scopeAssignmentsToScout(assignments: PitAssignment[], scoutName: string): PitAssignment[]`

```typescript
import { 
  detectImportConflict,
  resolveImportStrategy 
} from '@/core/lib/pitAssignments/importStrategy';

if (detectImportConflict(existing, incoming)) {
  const strategy = resolveImportStrategy(existing, incoming);  // => 'merge'
}
```

### 7. **index.ts**
**Public API** that orchestrates all utilities. Main entry point for most callers.

**Exports:**
- `buildPitAssignmentsTransferPayload(eventKey, sourceScoutName): PitAssignmentTransferPayload`
- `hasPitAssignmentImportConflict(payload): boolean`
- `importPitAssignmentsPayload(payload, currentScoutName, strategy?): PitAssignmentImportResult`
- `markPitAssignmentCompleted(eventKey, scoutName, teamNumber): boolean`
- Plus all re-exported utilities from submodules

```typescript
import { 
  buildPitAssignmentsTransferPayload,
  importPitAssignmentsPayload,
  normalizeScoutName 
} from '@/core/lib/pitAssignments';

// Build payload to push
const payload = buildPitAssignmentsTransferPayload(eventKey, 'lead-scout');
pushDataToAll(payload, 'pit-assignments');

// Import on receiving scout
const result = importPitAssignmentsPayload(payload, 'scout-a');
```

### 8. **pitAssignmentTransfer.ts** (Root Level)
**Backward-compatible wrapper**. Re-exports everything from the modular structure to avoid breaking existing imports.

```typescript
// Old imports still work:
import { loadPitAssignmentsForEvent } from '@/core/lib/pitAssignmentTransfer';

// But new code should use the modular path:
import { loadPitAssignmentsForEvent } from '@/core/lib/pitAssignments/assignmentLoading';
```

## Usage Patterns

### Pattern 1: Use High-Level API (Recommended)

```typescript
import {
  buildPitAssignmentsTransferPayload,
  importPitAssignmentsPayload,
  loadPitAssignmentsForEvent,
} from '@/core/lib/pitAssignments';

// On lead scout: push all assignments
const payload = buildPitAssignmentsTransferPayload(eventKey, 'lead-scout');
pushDataToAll(payload, 'pit-assignments');

// On receiving scout: import with auto-strategy
const result = importPitAssignmentsPayload(payload, 'scout-a');
console.log(`Imported ${result.importedCount} assignments using "${result.strategy}" strategy`);

// Load to display
const myAssignments = loadPitAssignmentsForEvent(eventKey);
```

### Pattern 2: Direct Utility Access (Specific Tasks)

```typescript
// Scout name consistency
import { normalizeScoutName } from '@/core/lib/pitAssignments/scoutNameNormalization';
const normalized = normalizeScoutName("Alice (Lead Scout)");  // => "alice (lead scout)"

// Storage operations
import { 
  savePitAssignmentsForEvent,
  loadMyPitAssignments 
} from '@/core/lib/pitAssignments/assignmentLoading';
const myList = loadMyPitAssignments(eventKey, 'Alice');

// Merging
import { mergeAssignments } from '@/core/lib/pitAssignments/assignmentMerging';
const merged = mergeAssignments(old, updated);
```

### Pattern 3: Custom Strategy Logic

```typescript
import {
  detectImportConflict,
  resolveImportStrategy,
  scopeAssignmentsToScout,
} from '@/core/lib/pitAssignments/importStrategy';

// Manually check for conflict
if (detectImportConflict(existing, incoming)) {
  // Prompt user for strategy choice
  const userStrategy = await askUserForStrategy();
  const resolved = resolveImportStrategy(existing, incoming, userStrategy);
}

// Scope to personal assignments
const myAssignments = scopeAssignmentsToScout(allAssignments, currentScout);
```

## Benefits

✅ **Clear Separation of Concerns** — Each utility has single responsibility  
✅ **Better Tree-Shaking** — Unused utilities can be eliminated by bundlers  
✅ **Improved Testability** — Easy to unit test individual functions  
✅ **Easier to Extend** — Add new strategies/utilities without touching existing code  
✅ **Backward Compatible** — Old imports still work via root-level wrapper  
✅ **Well-Documented** — JSDoc comments on every function  

## Alignment with Framework Principles

From **[GAME_COMPONENTS.md](../GAME_COMPONENTS.md)** — Best Practices:

| Principle | Implementation |
|-----------|-----------------|
| ✅ Keep all logic modular | Separated into 7 focused files |
| ✅ Use separate files for different concerns | Per-file purpose clearly defined |
| ✅ Document with JSDoc comments | Every public function documented |
| ✅ Use TypeScript interfaces for type safety | Strong typing throughout |
| ✅ Keep things encapsulated | Internal functions prefixed with `_` or kept private |

## Migration Path (Phase 1 → Phase 2)

When extracted to npm packages:

```
maneuver-core/
├── src/core/lib/pitAssignments/  ← Extract to separate package
│   └── ... (all utilities)
│
maneuver-pit-assignments/  ← New npm package
├── src/
│   ├── scoutNameNormalization.ts
│   ├── storageKeys.ts
│   ├── parseJson.ts
│   ├── assignmentLoading.ts
│   ├── assignmentMerging.ts
│   ├── importStrategy.ts
│   └── index.ts
└── package.json
```

Old code:
```typescript
import { loadPitAssignmentsForEvent } from '@/core/lib/pitAssignments';
```

Future code:
```typescript
import { loadPitAssignmentsForEvent } from 'maneuver-pit-assignments/assignmentLoading';
```

## Summary

This refactoring transforms pit assignment logic from a **247-line monolithic file** into **7 focused utilities** with clear purposes, each optimizable independently. The architecture supports Phase 2 extraction to npm packages while maintaining backward compatibility and improving code quality.

---

**Reference:** [GAME_COMPONENTS.md](../GAME_COMPONENTS.md) — Component & Utility Organization  
**Related:** [PIT_ASSIGNMENTS.md](./PIT_ASSIGNMENTS.md) — UI/Feature Documentation
