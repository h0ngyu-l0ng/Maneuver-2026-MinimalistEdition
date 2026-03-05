import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { StatusToggles } from "@/game-template/components";
import { FIELD_ELEMENTS } from "@/game-template/components/field-map";
import { formatDurationSecondsLabel } from "@/game-template/duration";
import { TELEOP_PHASE_DURATION_MS } from "@/game-template/constants";
import { useWorkflowNavigation } from "@/core/hooks/useWorkflowNavigation";
import { submitMatchData } from "@/core/lib/submitMatch";
import { useGame } from "@/core/contexts/GameContext";
import { workflowConfig } from "@/game-template/game-schema";
import PlusMinusButton from "@/core/components/ui/plusMinusButton";

const TeleopScoringPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transformation } = useGame();
  const states = location.state;
  const { getNextRoute, getPrevRoute, isLastPage } = useWorkflowNavigation();
  const isSubmitPage = isLastPage('teleopScoring');

  const getSavedState = () => {
    const saved = localStorage.getItem("teleopStateStack");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  };

  const getSavedStatus = () => {
    const saved = localStorage.getItem("teleopRobotStatus");
    return saved ? JSON.parse(saved) : {};
  };

  const getSavedHistory = () => {
    const saved = localStorage.getItem("teleopUndoHistory");
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

  // Save state to localStorage whenever actions change
  useEffect(() => {
    localStorage.setItem("teleopStateStack", JSON.stringify(scoringActions));
  }, [scoringActions]);

  // Save robot status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("teleopRobotStatus", JSON.stringify(robotStatus));
  }, [robotStatus]);

  // Save undo history to localStorage
  useEffect(() => {
    localStorage.setItem("teleopUndoHistory", JSON.stringify(undoHistory));
  }, [undoHistory]);

  // const addScoringAction = (action: any) => {
  //   const newAction = { ...action, timestamp: Date.now() };
  //   setScoringActions((prev: any) => [...prev, newAction]);
  //   // Add to undo history
  //   setUndoHistory((prev: any) => [...prev, { type: 'action', data: newAction }]);
  // };

  const updateRobotStatus = (updates: Partial<any>) => {
    // Save current state to undo history BEFORE updating
    setUndoHistory((history: any) => [...history, { type: 'status', data: robotStatus }]);
    // Update the status
    setRobotStatus((prev: any) => ({ ...prev, ...updates }));
  };

  // const undoLastAction = () => {
  //   if (undoHistory.length === 0) {
  //     toast.error("No changes to undo");
  //     return;
  //   }

  //   const lastChange = undoHistory[undoHistory.length - 1];

  //   if (lastChange.type === 'action') {
  //     // Undo scoring action
  //     setScoringActions((prev: any) => prev.slice(0, -1));
  //   } else if (lastChange.type === 'status') {
  //     // Restore previous status
  //     setRobotStatus(lastChange.data);
  //   }

  //   // Remove from undo history
  //   setUndoHistory((prev: any) => prev.slice(0, -1));
  // };

  const handleBack = () => {
    const prevRoute = getPrevRoute('teleopScoring') || '/auto-scoring';
    navigate(prevRoute, {
      state: {
        inputs: states?.inputs,
        autoStateStack: states?.autoStateStack,
        autoRobotStatus: states?.autoRobotStatus,
        ...(states?.rescout && { rescout: states.rescout }),
      },
    });
  };

  // const handleTeleopClimbStartPreset = (seconds: number) => {
  //   updateRobotStatus({
  //     teleopClimbStartTimeSecRemaining:
  //       teleopClimbStartTimeSecRemaining === seconds ? null : seconds,
  //   });
  // };

  // const handleTeleopClimbStartInput = (rawValue: string) => {
  //   if (rawValue === '') {
  //     updateRobotStatus({ teleopClimbStartTimeSecRemaining: null });
  //     return;
  //   }

  //   const parsed = Number.parseInt(rawValue, 10);
  //   if (Number.isNaN(parsed)) return;

  //   const clamped = Math.max(0, Math.min(135, parsed));
  //   updateRobotStatus({ teleopClimbStartTimeSecRemaining: clamped });
  // };

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
        let addedAny = false;

        for (const [elementKey, startTime] of stuckEntries) {
          if (startTime && typeof startTime === 'number') {
            const obstacleType = elementKey.includes('trench') ? 'trench' : 'bump';
            const element = FIELD_ELEMENTS[elementKey as keyof typeof FIELD_ELEMENTS];
            const duration = Math.min(now - startTime, TELEOP_PHASE_DURATION_MS);

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
            addedAny = true;
          }
        }

        if (addedAny) {
          actionsToUse = nextActions;
          localStorage.removeItem('teleopStuckStarts');
          setScoringActions(nextActions);
        }
      }

      // Also capture active broken down time
      const teleopBrokenDownStart = localStorage.getItem('teleopBrokenDownStart');
      if (teleopBrokenDownStart) {
        const startTime = parseInt(teleopBrokenDownStart, 10);
        const duration = Date.now() - startTime;
        const currentTotal = parseInt(localStorage.getItem('teleopBrokenDownTime') || '0', 10);
        localStorage.setItem('teleopBrokenDownTime', String(currentTotal + duration));
        localStorage.removeItem('teleopBrokenDownStart');
      }
    }

    if (Array.isArray(finalActions)) {
      setScoringActions(actionsToUse);
    }
    localStorage.setItem("teleopStateStack", JSON.stringify(actionsToUse));

    if (isSubmitPage) {
      // This is the last page - submit match data
      const success = await submitMatchData({
        inputs: states?.inputs,
        transformation,
        onSuccess: () => navigate('/game-start'),
      });
      if (!success) return;
    } else {
      const nextRoute = getNextRoute('teleopScoring') || '/endgame';
      navigate(nextRoute, {
        state: {
          inputs: states?.inputs,
          autoStateStack: states?.autoStateStack,
          autoRobotStatus: states?.autoRobotStatus,
          teleopStateStack: actionsToUse,
          teleopRobotStatus: robotStatus,
          ...(states?.rescout && { rescout: states.rescout }),
        },
      });
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center px-4 pt-8 pb-24 md:px-6 md:pt-10 2xl:pb-6">
      <div className="w-full max-w-7xl">
        <h1 className="pb-4 text-2xl font-bold md:text-3xl">Teleoperated</h1>
      </div>
      <div className="flex w-full max-w-7xl min-h-0 flex-col-reverse items-start gap-4 md:gap-6 lg:flex-row">

        {/* Main Scoring Section */}
        <div className="w-full min-h-0 space-y-4 overflow-y-auto lg:flex-1 lg:min-w-0">

          {/* Game-Specific Scoring Sections */}
          {/* <ScoringSections
            phase="teleop"
            onAddAction={addScoringAction}
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
              {isSubmitPage ? 'Submit Match Data' : 'Continue to Endgame'}
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
                <CardTitle className="text-lg">Teleoperated</CardTitle>
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
          {workflowConfig.pages.showTeleopStatus && (
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Robot Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusToggles
                  phase="teleop"
                  status={robotStatus}
                  onStatusUpdate={updateRobotStatus}
                />
              </CardContent>
            </Card>
          )}

          {/* <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teleop Climb Start Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {TELEOP_CLIMB_START_PRESETS.map((seconds) => (
                  <Button
                    key={seconds}
                    type="button"
                    variant={teleopClimbStartTimeSecRemaining === seconds ? "default" : "outline"}
                    onClick={() => handleTeleopClimbStartPreset(seconds)}
                    className="h-9"
                  >
                    {seconds === 30 ? '30+' : `${seconds}s`}
                  </Button>
                ))}
              </div>

              <div className="space-y-1">
                <label htmlFor="teleop-climb-start-time" className="text-sm text-muted-foreground">
                  Exact seconds remaining (0-135)
                </label>
                <Input
                  id="teleop-climb-start-time"
                  type="number"
                  min={0}
                  max={135}
                  value={teleopClimbStartTimeSecRemaining ?? ''}
                  onChange={(e) => handleTeleopClimbStartInput(e.target.value)}
                  placeholder="Type exact time"
                />
              </div>
            </CardContent>
          </Card> */}

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
              {isSubmitPage ? 'Submit Match Data' : 'Continue to Endgame'}
              <ArrowRight className="ml-0.5" />
            </Button>
          </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeleopScoringPage;
