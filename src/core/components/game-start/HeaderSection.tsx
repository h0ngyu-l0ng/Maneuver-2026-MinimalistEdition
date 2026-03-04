import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import { ROLE_LABELS } from "@/core/types/scoutMetaData";
import { PlayerStationSheet } from './PlayerStationSheet';
import { ScoutOptionsSheet } from './ScoutOptionsSheet';
import type { ScoutOptionsState, ScoutOptionsContentProps } from '@/types';
import type { ComponentType } from 'react';

interface HeaderSectionProps {
  currentScout: string | null;
  currentScoutRoles: string[];
  showWarning: boolean;
  scoutOptions: ScoutOptionsState;
  onScoutOptionChange: (key: string, value: boolean) => void;
  customScoutOptionsContent?: ComponentType<ScoutOptionsContentProps>;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  currentScout,
  currentScoutRoles,
  showWarning,
  scoutOptions,
  onScoutOptionChange,
  customScoutOptionsContent,
}) => {
  return (
    <>
      {showWarning && (
        <Card className="w-full border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-amber-700">
                Please select a scout from the sidebar before starting
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {(localStorage.getItem('lastDataScouter') || localStorage.getItem('lastCommentScouter')) && (
        <Card className="w-full border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent>
            {localStorage.getItem('lastDataScouter') && (
              <div className="text-sm">
                <strong>{ROLE_LABELS.dataScouter.label}:</strong> {localStorage.getItem('lastDataScouter')}
              </div>
            )}
            {localStorage.getItem('lastCommentScouter') && (
              <div className="text-sm">
                <strong>{ROLE_LABELS.commentScouter.label}:</strong> {localStorage.getItem('lastCommentScouter')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">Match Information</CardTitle>
              {currentScout && (
                <p className="text-sm text-muted-foreground">
                  Scouting as:{" "}
                  <span className="font-medium">{currentScout}</span>
                  {currentScoutRoles.length > 0 && (
                    <span className="ml-1 text-xs italic">
                      ({currentScoutRoles.map(r => {
                        const roleKey = r as 'commentScouter' | 'dataScouter' | 'leadership' | 'mentors' | 'unlockLeaderboard';
                        return ROLE_LABELS[roleKey]?.label || r;
                      }).join(', ')})
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PlayerStationSheet />
              <ScoutOptionsSheet
                options={scoutOptions}
                onOptionChange={onScoutOptionChange}
                customContent={customScoutOptionsContent}
              />
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
};

export default HeaderSection;
