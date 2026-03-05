import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { StatusToggles } from "@/game-template/components";
import { FIELD_ELEMENTS } from "@/game-template/components/field-map";
import { formatDurationSecondsLabel } from "@/game-template/duration";
import { AUTO_PHASE_DURATION_MS } from "@/game-template/constants";
import { useWorkflowNavigation } from "@/core/hooks/useWorkflowNavigation";
import { submitMatchData } from "@/core/lib/submitMatch";
import { useGame } from "@/core/contexts/GameContext";
import { workflowConfig } from "@/game-template/game-schema";
import PlusMinusButton from "@/core/components/ui/plusMinusButton";
import { UniversalDropdown } from "@/core/components/ui/universal-dropdown";

const AUTO_CLIMB_LEVEL_OPTIONS = [
  { value: "none", label: "No Climb" },
  { value: "1", label: "Level 1" },
  { value: "2", label: "Level 2" },
  { value: "3", label: "Level 3" },
];


const AutoScoringPage = () => {
  const { transformation } = useGame();
  const location = useLocation();
  const navigate = useNavigate();
  const states = location.state;
  const { getNextRoute, getPrevRoute, isLastPage } = useWorkflowNavigation();
  const isSubmitPage = isLastPage('autoScoring');

  const getSavedState = () => {
    const saved = localStorage.getItem("autoStateStack");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  };

  const getSavedStatus = () => {
    const saved = localStorage.getItem("autoRobotStatus");
    return saved ? JSON.parse(saved) : {};
  };

  const getSavedHistory = () => {
    const saved = localStorage.getItem("autoUndoHistory");
    return saved ? JSON.parse(saved) : [];
  };

  const [scoringActions, setScoringActions] = useState(getSavedState());
  const [robotStatus, setRobotStatus] = useState(getSavedStatus());
  const [undoHistory, setUndoHistory] = useState(getSavedHistory());
  const ballsShotCount = typeof robotStatus?.ballsShotCount === 'number'
    ? Math.max(0, robotStatus.ballsShotCount)
    : 0;
  const cycleCount = typeof robotStatus?.cycleCount === 'number'
    ? Math.max(0, robotStatus.cycleCount)
    : 0;
  const autoClimbLevel = robotStatus?.autoClimbL3
    ? "3"
    : robotStatus?.autoClimbL2
      ? "2"
      : robotStatus?.autoClimbL1
        ? "1"
        : "none";

  // Save state to localStorage whenever actions change
  useEffect(() => {
    localStorage.setItem("autoStateStack", JSON.stringify(scoringActions));
  }, [scoringActions]);

  // Save robot status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("autoRobotStatus", JSON.stringify(robotStatus));
  }, [robotStatus]);

  // Save undo history to localStorage
  useEffect(() => {
    localStorage.setItem("autoUndoHistory", JSON.stringify(undoHistory));
  }, [undoHistory]);

  const updateRobotStatus = (updates: Partial<any>) => {
    setUndoHistory((history: any) => [...history, { type: 'status', data: robotStatus }]);
    setRobotStatus((prev: any) => ({ ...prev, ...updates }));
  };

  const handleAutoClimbLevelChange = (value: string) => {
    updateRobotStatus({
      autoClimbL1: value === "1",
      autoClimbL2: value === "2",
      autoClimbL3: value === "3",
    });
  };

  const handleBack = () => {
    const prevRoute = getPrevRoute('autoScoring') || '/auto-start';
    navigate(prevRoute, {
      state: {
        inputs: states?.inputs,
        ...(states?.rescout && { rescout: states.rescout }),
      },
    });
  };



  const handleProceed = async (finalActions?: any[]) => {
    let actionsToUse = Array.isArray(finalActions) ? finalActions : scoringActions;

    // Capture any active stuck timers if they wasn't captured by the field map's internal onProceed
    if (!finalActions) {
      const savedStuck = localStorage.getItem('teleopStuckStarts');
      if (savedStuck) {
        const stuckStarts = JSON.parse(savedStuck);
        const stuckEntries = Object.entries(stuckStarts);
        const now = Date.now();
        const nextActions = [...actionsToUse];
        const nextStuckStarts: Record<string, number> = { ...stuckStarts };
        let addedAny = false;

        for (const [elementKey, startTime] of stuckEntries) {
          if (startTime && typeof startTime === 'number') {
            const obstacleType = elementKey.includes('trench') ? 'trench' : 'bump';
            const element = FIELD_ELEMENTS[elementKey as keyof typeof FIELD_ELEMENTS];
            const duration = Math.min(now - startTime, AUTO_PHASE_DURATION_MS);

            const unstuckWaypoint = {
              id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'unstuck',
              action: `unstuck-${obstacleType}`,
              position: element ? { x: element.x, y: element.y } : { x: 0, y: 0 },
              timestamp: now,
              duration,
              obstacleType,
              amountLabel: formatDurationSecondsLabel(duration)
            };
            nextActions.push(unstuckWaypoint);
            // Persistent stuck: reset start time to 'now' for Teleop tracking
            nextStuckStarts[elementKey] = now;
            addedAny = true;
          }
        }

        if (addedAny) {
          actionsToUse = nextActions;
          localStorage.setItem('teleopStuckStarts', JSON.stringify(nextStuckStarts));
          setScoringActions(nextActions);
        }
      }

      // Also capture active broken down time
      const autoBrokenDownStart = localStorage.getItem('autoBrokenDownStart');
      if (autoBrokenDownStart) {
        const startTime = parseInt(autoBrokenDownStart, 10);
        const duration = Date.now() - startTime;
        const currentTotal = parseInt(localStorage.getItem('autoBrokenDownTime') || '0', 10);
        localStorage.setItem('autoBrokenDownTime', String(currentTotal + duration));
        // Reset for teleop
        localStorage.setItem('teleopBrokenDownStart', String(Date.now()));
      }
    }

    if (Array.isArray(finalActions)) {
      setScoringActions(actionsToUse);
    }
    localStorage.setItem("autoStateStack", JSON.stringify(actionsToUse));

    if (isSubmitPage) {
      // This is the last page - submit match data
      const success = await submitMatchData({
        inputs: states?.inputs,
        transformation,
        onSuccess: () => navigate('/game-start'),
      });
      if (!success) return;
    } else {
      const nextRoute = getNextRoute('autoScoring') || '/teleop-scoring';
      navigate(nextRoute, {
        state: {
          inputs: states?.inputs,
          autoStateStack: actionsToUse,
          autoRobotStatus: robotStatus,
          ...(states?.rescout && { rescout: states.rescout }),
        },
      });
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center px-4 pt-8 pb-24 md:px-6 md:pt-10 2xl:pb-6">
      <div className="w-full max-w-7xl">
        <h1 className="pb-4 text-2xl font-bold md:text-3xl">Autonomous</h1>
      </div>

      <div className="flex w-full max-w-7xl min-h-0 flex-col-reverse items-start gap-4 md:gap-6 lg:flex-row">

        {/* Main Scoring Section */}
        <div className="w-full min-h-0 space-y-4 overflow-y-auto lg:flex-1 lg:min-w-0">

          {/* Game-Specific Scoring Sections */}
          {/* <ScoringSections
            phase="auto"
            onAddAction={addScoringAction}
            actions={scoringActions}
            scoutOptions={states?.inputs?.scoutOptions}
            onUndo={undoLastAction}
            canUndo={undoHistory.length > 0}
            matchNumber={states?.inputs?.matchNumber}
            matchType={states?.inputs?.matchType}
            teamNumber={states?.inputs?.selectTeam}
            onBack={handleBack}
            onProceed={handleProceed}
          /> */}

          {/* Action Buttons - Mobile Only */}
          <div className="flex w-full gap-3 sm:gap-4 lg:hidden">
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 flex-1 text-base sm:text-lg"
            >
              Back
            </Button>
            <Button
              onClick={() => handleProceed()}
              className={`h-12 flex-[2] text-base font-semibold sm:text-lg ${isSubmitPage ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {isSubmitPage ? 'Submit Match Data' : 'Continue to Teleop'}
              <ArrowRight className="ml-0.5" />
            </Button>
          </div>
        </div>

        {/* Info and Controls Sidebar */}
        <div className="w-full min-h-0 pb-4 lg:w-80 lg:pb-0 xl:w-96">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">

            {/* Match Info Card */}
            {states?.inputs && (
              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Autonomous</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Match:</span>
                    <span className="font-medium">{states.inputs.matchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team:</span>
                    <span className="font-medium">{states.inputs.selectTeam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actions:</span>
                    <Badge variant="outline">{scoringActions.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Recent Actions */}
            {/* <Card className="h-64">
              <CardHeader>
                <CardTitle className="text-lg">Recent Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 h-40 overflow-y-auto pb-2">
                  {undoHistory.slice(-8).reverse().map((change: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {change.type === 'action' ? (
                          <>
                            {change.data.actionType || change.data.type || 'Action'}
                            {change.data.pieceType && ` - ${change.data.pieceType}`}
                            {change.data.location && ` @ ${change.data.location}`}
                            {change.data.level && ` (${change.data.level})`}
                          </>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400">Status Change</span>
                        )}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        #{undoHistory.length - index}
                      </Badge>
                    </div>
                  ))}
                  {undoHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No actions recorded yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card> */}

            {/* Robot Status Card */}
             {workflowConfig.pages.showAutoStatus && (
              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Robot Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusToggles
                    phase="auto"
                    status={robotStatus}
                    onStatusUpdate={updateRobotStatus}
                  />
                </CardContent>
              </Card>
            )}

            {/* <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auto Climb Start Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {AUTO_CLIMB_START_PRESETS.map((seconds) => (
                    <Button
                      key={seconds}
                      type="button"
                      variant={autoClimbStartTimeSecRemaining === seconds ? "default" : "outline"}
                      onClick={() => handleAutoClimbStartPreset(seconds)}
                      className="h-9"
                    >
                      {seconds}s
                    </Button>
                  ))}
                </div>

                <div className="space-y-1">
                  <label htmlFor="auto-climb-start-time" className="text-sm text-muted-foreground">
                    Exact seconds remaining (0-20)
                  </label>
                  <Input
                    id="auto-climb-start-time"
                    type="number"
                    min={0}
                    max={20}
                    value={autoClimbStartTimeSecRemaining ?? ''}
                    onChange={(e) => handleAutoClimbStartInput(e.target.value)}
                    placeholder="Type exact time"
                  />
                </div>
              </CardContent>
            </Card> */} 

            {/* Undo Button */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Fuel Scored</CardTitle>
              </CardHeader>
              <CardContent>
                <PlusMinusButton
                  count={ballsShotCount}
                  onChange={(nextCount: number) => updateRobotStatus({ ballsShotCount: nextCount })}
                  incrementLabel="+1 Fuel Scored"
                  numberBetweenButtons
                  buttonClassName="h-20 text-xl"
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-2xl">Number of Cycles</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlusMinusButton
                    count={cycleCount}
                    onChange={(nextCount: number) => updateRobotStatus({ cycleCount: nextCount })}
                    incrementLabel="+1 Cycle"
                    buttonClassName="h-11 text-base"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-2xl">Auto Climb Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <UniversalDropdown
                    value={autoClimbLevel}
                    options={AUTO_CLIMB_LEVEL_OPTIONS}
                    onValueChange={handleAutoClimbLevelChange}
                    title="Select Auto Climb Level"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Undo Button */}
            {/* <Button
              variant="outline"
              onClick={undoLastAction}
              disabled={undoHistory.length === 0}
              className="w-full"
            >
              Undo Last Change
            </Button> */}

            {/* Action Buttons - Desktop Only */}
            <div className="hidden w-full gap-4 sm:col-span-2 lg:flex lg:col-span-1">
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-12 flex-1 text-lg"
              >
                Back
              </Button>
              <Button
                onClick={() => handleProceed()}
                className={`h-12 flex-[2] text-lg font-semibold ${isSubmitPage ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {isSubmitPage ? 'Submit Match Data' : 'Continue to Teleop'}
                <ArrowRight className="ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoScoringPage;
