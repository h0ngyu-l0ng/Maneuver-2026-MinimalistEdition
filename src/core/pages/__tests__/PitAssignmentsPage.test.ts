/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMatchAssignments } from '../../components/pit-assignments/MatchAssignmentSection';

// mock getScout so we can control roles
vi.mock('../../lib/scoutGamificationUtils', () => ({
  getScout: vi.fn(),
}));

import { getScout } from '../../lib/scoutGamificationUtils';

describe('generateMatchAssignments helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('produces assignments with appropriate slot values based on scout roles', async () => {
    const matches = [
      { matchKey: 'qm1', matchNum: 1 },
      { matchKey: 'qm2', matchNum: 2 },
      { matchKey: 'qm3', matchNum: 3 },
      { matchKey: 'qm4', matchNum: 4 },
    ];
    const scouts = ['Alice', 'Bob'];

    // stub responses for scouts
    ((getScout as unknown) as any).mockImplementation(async (name: string) => {
      if (name === 'Alice') {
        return { scoutRoles: ['commentScouter'] };
      }
      if (name === 'Bob') {
        return { scoutRoles: ['dataScouter'] };
      }
      return { scoutRoles: [] };
    });

    const result = await generateMatchAssignments('event1', matches, scouts);

    expect(result.length).toBe(4);
    // alternating assignment order: Alice, Bob, Alice, Bob
    expect(result[0].scoutName).toBe('Alice');
    expect(result[0].slot).toBe('redAlliance');
    expect(result[1].scoutName).toBe('Bob');
    expect(result[1].slot).toBe('red1');
    expect(result[2].scoutName).toBe('Alice');
    expect(result[2].slot).toBe('redAlliance');
    expect(result[3].scoutName).toBe('Bob');
    expect(result[3].slot).toBe('red2');
  });
});
