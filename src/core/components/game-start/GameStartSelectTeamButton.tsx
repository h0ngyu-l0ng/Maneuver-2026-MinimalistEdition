import React from 'react';
import { Button } from '@/core/components/ui/button';
import { Star } from 'lucide-react';

interface GameStartSelectTeamButtonProps {
  currentTeamType: string;
  currentTeamStatus: boolean;
  clickTeam: (type: string, status: boolean) => void;
  teamName: string;
  isPreferred: boolean;
}

const GameStartSelectTeamButton: React.FC<GameStartSelectTeamButtonProps> = ({
  currentTeamType,
  currentTeamStatus,
  clickTeam,
  teamName,
  isPreferred,
}) => {
  return (
    <Button
      onClick={() => clickTeam(currentTeamType, currentTeamStatus)}
      className={`w-full h-16 text-lg relative ${
        currentTeamStatus
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-foreground'
      }`}
      variant={currentTeamStatus ? 'default' : 'outline'}
    >
      <div className="flex items-center justify-center gap-2 w-full">
        <span>Team {teamName}</span>
        {isPreferred && (
          <Star className="h-4 w-4 fill-current" />
        )}
      </div>
    </Button>
  );
};

export default GameStartSelectTeamButton;
