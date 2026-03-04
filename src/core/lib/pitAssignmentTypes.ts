// Types for pit assignment functionality

export interface PitAssignment {
  id: string;
  eventKey: string;
  teamNumber: number;
  scoutName: string;
  assignedAt: number;
  completed: boolean;
  notes?: string;
}

// Assignments for matches (used alongside pit assignments in the same page)
export interface MatchAssignment {
  id: string;
  eventKey: string;
  matchKey: string; // unique identifier for the match (e.g. qm24, sf2m1)
  scoutName: string;
  assignedAt: number;
  completed: boolean;
  /**
   * Optional slot information describing what the scout should watch.
   * Examples:
   *   - "red1" / "blue3" (individual robot positions)
   *   - "redAlliance" / "blueAlliance" (entire alliance for comment scouters)
   */
  slot?: string;
  notes?: string;
}

export type AssignmentMode = 'sequential' | 'manual';
export interface PitAssignmentScout {
  name: string;
  addedAt: number;
}
