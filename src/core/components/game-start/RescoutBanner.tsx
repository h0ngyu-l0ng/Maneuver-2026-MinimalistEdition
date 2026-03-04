import React from 'react';
import { Alert } from "@/core/components/ui/alert";
import { RefreshCw } from 'lucide-react';

interface RescoutBannerProps {
  eventKey: string;
  matchNumber: string;
  teamNumber: string;
  currentTeamIndex?: number;
  totalTeams?: number;
}

const RescoutBanner: React.FC<RescoutBannerProps> = ({
  eventKey,
  matchNumber,
  teamNumber,
  currentTeamIndex = 0,
  totalTeams = 0,
}) => {
  return (
    <Alert className="flex border-amber-500 bg-amber-50 dark:bg-amber-950/20 py-3">
      <div className="flex items-center gap-3 w-full">
        <RefreshCw className="h-4 w-4 text-amber-600 shrink-0" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Re-scouting:</span> <strong>{eventKey && `${eventKey} `}</strong> Match <strong>{matchNumber}</strong> for Team <strong>{teamNumber}</strong>
          {totalTeams > 0 && (
            <span className="ml-2 opacity-75">
              ({currentTeamIndex + 1}/{totalTeams})
            </span>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default RescoutBanner;
