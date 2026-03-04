import React from 'react';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import GameStartSelectTeam from '@/core/components/game-start/GameStartSelectTeam';
import { EventNameSelector } from '@/core/components/game-start/EventNameSelector';

interface StationInfo {
  alliance?: string;
  teamPosition: number;
}

interface Props {
  eventKey: string;
  matchNumber: string;
  debouncedMatchNumber: string;
  selectTeam: string;
  stationInfo: StationInfo;

  assignmentSlot: string | null;

  setEventKey: (k: string) => void;
  setMatchNumber: (n: string) => void;
  setSelectTeam: (t: string | null) => void;
}

const GameStartInputSection: React.FC<Props> = ({
  eventKey,
  
  matchNumber,
  
  debouncedMatchNumber,
  selectTeam,
  
  stationInfo,
  assignmentSlot,

  setEventKey,
  setMatchNumber,
  setSelectTeam,
}) => {
  const handleMatchNumberChange = (val: string) => {
    // allow only digits
    setMatchNumber(val.replace(/[^0-9]/g, ''));
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Event</Label>
        <EventNameSelector
          currentEventKey={eventKey}
          onEventKeyChange={setEventKey}
        />
      </div>

      <div className="space-y-2">
        <Label>Match Number</Label>
        <Input
          type="number"
          value={matchNumber}
          onChange={e => handleMatchNumberChange(e.target.value)}
          className="text-lg h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>Team Selection</Label>
        <GameStartSelectTeam
          defaultSelectTeam={selectTeam}
          setSelectTeam={setSelectTeam}
          selectedMatch={debouncedMatchNumber}
          selectedAlliance={stationInfo.alliance || ''}
          selectedEventKey={eventKey}
          preferredTeamPosition={stationInfo.teamPosition}
        />
        {assignmentSlot && (
          <p className="text-sm text-muted-foreground">
            Assigned: {assignmentSlot.replace(/([A-Z])/g, ' $1')}
          </p>
        )}
      </div>
    </>
  );
};

export default GameStartInputSection;
