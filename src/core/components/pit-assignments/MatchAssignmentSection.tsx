import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { getScout } from '@/core/lib/scoutGamificationUtils';
import type { MatchAssignment } from '@/core/lib/pitAssignmentTypes';

export async function generateMatchAssignments(
  eventKey: string,
  matches: Array<{ matchKey: string; matchNum: number }>,
  scoutsList: string[],
): Promise<MatchAssignment[]> {
  const newAssign: MatchAssignment[] = [];
  const totalMatches = matches.length;
  const totalScouts = scoutsList.length;
  if (totalMatches === 0 || totalScouts === 0) return newAssign;

  const base = Math.floor(totalMatches / totalScouts);
  const rem = totalMatches % totalScouts;
  let idx = 0;
  const slotCounters: Record<string, number> = {};

  for (let si = 0; si < scoutsList.length && idx < totalMatches; si++) {
    const scout = scoutsList[si];
    let roles: string[] = [];
    try {
      const scoutObj = await getScout(scout);
      roles = scoutObj?.scoutRoles || [];
    } catch {
      roles = [];
    }

    const block = si < rem ? base + 1 : base;
    for (let k = 0; k < block && idx < totalMatches; k++, idx++) {
      const m = matches[idx];
      let slot: string | undefined;
      if (roles.includes('commentScouter')) {
        slot = 'redAlliance';
      } else if (roles.includes('dataScouter')) {
        const count = slotCounters[scout] || 0;
        const choices = ['red1', 'red2', 'red3'];
        slot = choices[count % choices.length];
        slotCounters[scout] = count + 1;
      }

      newAssign.push({
        id: `${eventKey}-${m.matchKey}`,
        eventKey,
        matchKey: m.matchKey,
        scoutName: scout,
        assignedAt: Date.now(),
        completed: false,
        slot,
      });
    }
  }

  return newAssign;
}

interface Props {
  eventKey: string;
  matchAssignments: MatchAssignment[];
  scoutsList: string[];
  onChange: (newList: MatchAssignment[]) => void;
}

const MatchAssignmentSection: React.FC<Props> = ({ eventKey, matchAssignments, scoutsList, onChange }) => {
  const [matches, setMatches] = useState<Array<{ matchKey: string; matchNum: number }>>([]);

  useEffect(() => {
    const raw = localStorage.getItem('matchData');
    if (raw) {
      try {
        const arr = JSON.parse(raw) as any[];
        const list = arr.map(m => ({ matchKey: m.matchKey || m.matchKey || `${m.matchType}${m.matchNum}`, matchNum: m.matchNum || 0 }));
        setMatches(list.sort((a, b) => a.matchNum - b.matchNum));
      } catch {
        setMatches([]);
      }
    }
  }, [eventKey]);

  const handleGenerate = async () => {
    const generated = await generateMatchAssignments(eventKey, matches, scoutsList);
    onChange(generated);
  };

  const handleManual = (matchKey: string) => {
    const scout = window.prompt('Assign scout name for ' + matchKey);
    if (!scout) return;
    const slot = window.prompt('Enter slot (e.g. red1, blue2, redAlliance). Leave blank for none:');
    const existing = matchAssignments.filter(a => a.matchKey !== matchKey);
    const assignment: any = { id: `${eventKey}-${matchKey}`, eventKey, matchKey, scoutName: scout, assignedAt: Date.now(), completed: false };
    if (slot && slot.trim()) assignment.slot = slot.trim();
    existing.push(assignment);
    onChange(existing);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Match Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button onClick={handleGenerate} disabled={scoutsList.length === 0 || matches.length === 0}>
            Generate Sequential
          </Button>
          <Button onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[400px]">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th>Match</th><th>Scout</th><th>Slot</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => {
                const assignment = matchAssignments.find(a => a.matchKey === m.matchKey);
                return (
                  <tr key={m.matchKey} className="cursor-pointer hover:bg-muted" onClick={() => handleManual(m.matchKey)}>
                    <td className="py-1">{m.matchKey}</td>
                    <td className="py-1">{assignment?.scoutName || '-'}</td>
                    <td className="py-1">{assignment?.slot || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchAssignmentSection;
