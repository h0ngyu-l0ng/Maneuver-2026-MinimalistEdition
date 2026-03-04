import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/core/components/ui/card";
import { toast } from "sonner";
import {
  GameStartInputSection,
  MatchTypeSelector,
  AllianceSelector,
  PredictionSelector,
  StatusCard,
  ActionButtons,
  HeaderSection,
  RescoutBanner,
  FormCard,
  CORE_SCOUT_OPTION_KEYS,
} from "@/core/components/game-start";
import { ROLE_LABELS } from "@/core/types/scoutMetaData";
import { createMatchPrediction, getPredictionForMatch } from "@/core/lib/scoutGamificationUtils";
import { useWorkflowNavigation } from "@/core/hooks/useWorkflowNavigation";
import { useScout } from "@/core/contexts/ScoutContext";
import { loadMatchAssignmentsForEvent } from '@/core/lib/pitAssignments/assignmentLoading';
import { normalizeScoutName } from '@/core/lib/pitAssignments/scoutNameNormalization';
import { useGame } from "@/core/contexts/GameContext";
import type { ScoutOptionsState } from "@/types";
import {
  GAME_SCOUT_OPTION_DEFAULTS,
} from "@/game-template/scout-options";

const SCOUT_OPTIONS_STORAGE_KEY = "scoutOptions";
const AUTO_SWITCH_ONCE_STORAGE_PREFIX = 'autoSwitchToTeleopDone';

const DEFAULT_SCOUT_OPTIONS: ScoutOptionsState = {
  [CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation]: false,
  [CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry]: false,
  [CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s]: false,
  ...GAME_SCOUT_OPTION_DEFAULTS,
};

const normalizeAutoCueStartMode = (options: ScoutOptionsState): ScoutOptionsState => {
  const autoAdvanceToTeleop =
    options[CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s] === true;
  const fromAutoScreenEntry =
    options[CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry] === true;
  const fromStartConfirmation =
    options[CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation] !== false;

  if (autoAdvanceToTeleop) {
    return {
      ...options,
      [CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation]: false,
      [CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry]: false,
      [CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s]: true,
    };
  }

  if (fromAutoScreenEntry) {
    return {
      ...options,
      [CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation]: false,
      [CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry]: true,
      [CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s]: false,
    };
  }

  if (!fromStartConfirmation) {
    return {
      ...options,
      [CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation]: false,
      [CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry]: false,
      [CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s]: false,
    };
  }

  return {
    ...options,
    [CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry]: false,
    [CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s]: false,
  };
};

const buildAutoSwitchOnceStorageKey = (
  eventKey: string,
  matchType: "qm" | "sf" | "f",
  matchNumber: string,
  teamNumber: string,
) => {
  return `${AUTO_SWITCH_ONCE_STORAGE_PREFIX}:${eventKey}:${matchType}:${matchNumber}:${teamNumber}`;
};

const GameStartPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const states = location.state;
  const { ui } = useGame();
  const { getNextRoute, isConfigValid } = useWorkflowNavigation();
  const { currentScout, currentScoutRoles, setCurrentScout } = useScout();

  // Debug log when currentScout changes
  useEffect(() => {
    console.log('📋 GameStartPage: currentScout =', currentScout);
  }, [currentScout]);

  // automatically default to last data scouter if none selected
  useEffect(() => {
    if (!currentScout) {
      const lastData = localStorage.getItem('lastDataScouter');
      if (lastData) {
        setCurrentScout(lastData);
      }
    }
  }, [currentScout, setCurrentScout]);

  // Detect re-scout mode from location.state - use useMemo to recalculate when location.state changes
  const rescoutData = useMemo(() => states?.rescout, [states]);
  const isRescoutMode = rescoutData?.isRescout || false;
  const rescoutMatch = rescoutData?.matchNumber;
  const rescoutTeam = rescoutData?.teamNumber;
  const rescoutAlliance = rescoutData?.alliance;
  const rescoutEventKey = rescoutData?.eventKey;
  const rescoutTeams = useMemo(() => rescoutData?.teams || [], [rescoutData?.teams]);
  const currentTeamIndex = rescoutData?.currentTeamIndex || 0;

  const parsePlayerStation = (scoutName?: string) => {
    let playerStation = null;
    if (scoutName) {
      playerStation = localStorage.getItem(`playerStation_${scoutName}`);
    }
    if (!playerStation) {
      playerStation = localStorage.getItem("playerStation");
    }
    if (!playerStation) return { alliance: "", teamPosition: 0 };

    if (playerStation === "lead") {
      return { alliance: "", teamPosition: 0 };
    }

    const parts = playerStation.split("-");
    if (parts.length === 2 && parts[1]) {
      const alliance = parts[0];
      const position = parseInt(parts[1]);
      return { alliance, teamPosition: position };
    }

    return { alliance: "", teamPosition: 0 };
  };

  const stationInfo = parsePlayerStation(currentScout);

  const getInitialMatchNumber = () => {
    if (states?.inputs?.matchNumber) {
      return states.inputs.matchNumber;
    }

    const storedMatchNumber = localStorage.getItem("currentMatchNumber");
    return storedMatchNumber || "1";
  };

  const [alliance, setAlliance] = useState(
    states?.inputs?.alliance || stationInfo.alliance || ""
  );
  const [matchNumber, setMatchNumber] = useState(getInitialMatchNumber());
  const [matchType, setMatchType] = useState<"qm" | "sf" | "f">("qm");
  const [debouncedMatchNumber, setDebouncedMatchNumber] = useState(matchNumber);
  const [selectTeam, setSelectTeam] = useState(() => {
    // Check rescout data first for single team mode
    if (rescoutData?.teamNumber) {
      return rescoutData.teamNumber;
    }
    // Check rescout data for batch mode
    if (rescoutData?.teams && rescoutData.teams.length > 0) {
      const currentIndex = rescoutData.currentTeamIndex || 0;
      return rescoutData.teams[currentIndex] || "";
    }
    // Fall back to inputs or empty
    return states?.inputs?.selectTeam || "";
  });
  const [eventKey, setEventKey] = useState(
    states?.inputs?.eventKey || localStorage.getItem("eventKey") || ""
  );
  const [predictedWinner, setPredictedWinner] = useState<"red" | "blue" | "none">("none");
  const [scoutOptions, setScoutOptions] = useState<ScoutOptionsState>(() => {
    const stored = localStorage.getItem(SCOUT_OPTIONS_STORAGE_KEY);
    if (!stored) return DEFAULT_SCOUT_OPTIONS;

    try {
      const parsed = JSON.parse(stored) as ScoutOptionsState;
      return normalizeAutoCueStartMode({
        ...DEFAULT_SCOUT_OPTIONS,
        ...parsed,
      });
    } catch {
      return DEFAULT_SCOUT_OPTIONS;
    }
  });

  // Debounce matchNumber for team selection
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedMatchNumber(matchNumber);
    }, 500);
    return () => clearTimeout(timeout);
  }, [matchNumber]);

  // Effect to save match number to localStorage when it changes
  useEffect(() => {
    if (matchNumber) {
      localStorage.setItem("currentMatchNumber", matchNumber);
    }
  }, [matchNumber]);

  // read match assignment when inputs change
  const [assignmentSlot, setAssignmentSlot] = useState<string | null>(null);
  useEffect(() => {
    if (!eventKey || !matchNumber || !currentScout) {
      setAssignmentSlot(null);
      return;
    }

    const assignments = loadMatchAssignmentsForEvent(eventKey);
    const normalized = normalizeScoutName(currentScout);
    const parsedMatchNum = parseInt(matchNumber, 10);
    let matchKey = `qm${parsedMatchNum}`;
    // try to look up actual key from stored matchData
    try {
      const raw = localStorage.getItem('matchData');
      if (raw) {
        const arr = JSON.parse(raw) as any[];
        const found = arr.find(m => m.matchNum === parsedMatchNum);
        if (found && found.matchKey) {
          matchKey = found.matchKey;
        }
      }
    } catch {
      // ignore
    }

    const myAssign = assignments.find(a => normalizeScoutName(a.scoutName) === normalized && a.matchKey === matchKey);
    if (myAssign && myAssign.slot) {
      setAssignmentSlot(myAssign.slot);

      // interpret slot to prefill alliance/team
      if (myAssign.slot.endsWith('Alliance')) {
        const side = myAssign.slot.startsWith('red') ? 'red' : 'blue';
        setAlliance(side as 'red' | 'blue');
      } else {
        const side = myAssign.slot.startsWith('red') ? 'red' : myAssign.slot.startsWith('blue') ? 'blue' : '';
        if (side) {
          setAlliance(side as 'red' | 'blue');
        }
        const pos = parseInt(myAssign.slot.replace(/^red|^blue/, ''), 10);
        if (side && pos && parsedMatchNum > 0) {
          // try to set actual team number from match data
          const raw = localStorage.getItem('matchData');
          if (raw) {
            try {
              const arr = JSON.parse(raw) as any[];
              const found = arr.find(m => m.matchNum === parsedMatchNum);
              if (found) {
                const allianceKey = side === 'red' ? 'redAlliance' : 'blueAlliance';
                const teams = found[allianceKey] as string[];
                if (teams && pos >= 1 && pos <= teams.length) {
                  setSelectTeam(teams[pos - 1]);
                }
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } else {
      setAssignmentSlot(null);
    }
  }, [eventKey, matchNumber, currentScout]);

  // Effect to load existing prediction when match/event changes
  useEffect(() => {
    const loadExistingPrediction = async () => {
      if (currentScout && eventKey && matchNumber) {
        try {
          const existingPrediction = await getPredictionForMatch(currentScout, eventKey, matchNumber);
          if (existingPrediction) {
            setPredictedWinner(existingPrediction.predictedWinner);
          } else {
            setPredictedWinner("none");
          }
        } catch (error) {
          console.error("Error loading existing prediction:", error);
          setPredictedWinner("none");
        }
      }
    };

    loadExistingPrediction();
  }, [matchNumber, eventKey, currentScout]);

  useEffect(() => {
    localStorage.setItem(SCOUT_OPTIONS_STORAGE_KEY, JSON.stringify(scoutOptions));
  }, [scoutOptions]);

  // Effect to pre-fill fields when in re-scout mode
  useEffect(() => {
    if (isRescoutMode) {
      if (rescoutMatch) {
        setMatchNumber(rescoutMatch);
      }
      if (rescoutAlliance) {
        setAlliance(rescoutAlliance as 'red' | 'blue');
      }
      if (rescoutEventKey) {
        setEventKey(rescoutEventKey);
      }

      // Single team or batch mode
      if (rescoutTeam) {
        setSelectTeam(rescoutTeam);
      } else if (rescoutTeams.length > 0 && currentTeamIndex < rescoutTeams.length) {
        const teamToScout = rescoutTeams[currentTeamIndex];
        setSelectTeam(teamToScout);
      }
    }
  }, [isRescoutMode, rescoutMatch, rescoutTeam, rescoutAlliance, rescoutEventKey, rescoutTeams, currentTeamIndex]);

  // Function to handle prediction changes and save them immediately
  const handlePredictionChange = async (newPrediction: "red" | "blue" | "none") => {
    setPredictedWinner(newPrediction);

    if (newPrediction !== "none" && currentScout && eventKey && matchNumber) {
      try {
        await createMatchPrediction(currentScout, eventKey, matchNumber, newPrediction);
        toast.success(`Prediction updated: ${newPrediction} alliance to win`);
      } catch (error) {
        console.error("Error saving prediction:", error);
        toast.error("Failed to save prediction");
      }
    }
  };

  const handleScoutOptionChange = (key: string, value: boolean) => {
    setScoutOptions((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (key === CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation && value) {
        next[CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry] = false;
        next[CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s] = false;
      }

      if (key === CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry && value) {
        next[CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation] = false;
        next[CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s] = false;
      }

      if (key === CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s && value) {
        next[CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation] = false;
        next[CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry] = false;
      }

      if (
        (key === CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation ||
          key === CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry ||
          key === CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s) &&
        value === false
      ) {
        next[CORE_SCOUT_OPTION_KEYS.startAutoCueFromStartConfirmation] = false;
        next[CORE_SCOUT_OPTION_KEYS.startAutoCueFromAutoScreenEntry] = false;
        next[CORE_SCOUT_OPTION_KEYS.autoAdvanceToTeleopAfter20s] = false;
      }

      return normalizeAutoCueStartMode(next);
    });
  };

  const validateInputs = () => {
    // Check workflow config is valid
    if (!isConfigValid) {
      toast.error("Workflow configuration error: At least one scouting page must be enabled");
      return false;
    }

    const inputs = {
      matchNumber,
      alliance,
      selectTeam,
      scoutName: currentScout,
      eventKey,
    };
    const hasNull = Object.values(inputs).some((val) => !val || val === "");

    if (!currentScout) {
      toast.error("Please select a scout from the sidebar first");
      return false;
    }

    if (!eventKey) {
      toast.error("Please set an event name/code first");
      return false;
    }

    // comment-only scouts may not need a team
    const isCommentOnly = currentScoutRoles.includes('commentScouter') && !currentScoutRoles.includes('dataScouter');
    if (hasNull && !(isCommentOnly && !selectTeam)) {
      toast.error("Fill In All Fields To Proceed");
      return false;
    }

    return true;
  };

  const handleStartScouting = async () => {
    if (!validateInputs()) return;

    // Save prediction if one was made
    if (predictedWinner !== "none" && currentScout && eventKey && matchNumber) {
      try {
        await createMatchPrediction(currentScout, eventKey, matchNumber, predictedWinner);
        toast.success(`Prediction saved: ${predictedWinner} alliance to win`);
      } catch (error) {
        console.error("Error saving prediction:", error);
        toast.error("Failed to save prediction");
      }
    }

    // Save inputs to localStorage (similar to ProceedBackButton logic)
    localStorage.setItem("matchNumber", matchNumber);
    localStorage.setItem("selectTeam", selectTeam);
    localStorage.setItem("alliance", alliance);
    localStorage.setItem(SCOUT_OPTIONS_STORAGE_KEY, JSON.stringify(scoutOptions));

    const autoSwitchOnceStorageKey = buildAutoSwitchOnceStorageKey(
      eventKey,
      matchType,
      matchNumber,
      selectTeam,
    );
    sessionStorage.removeItem(autoSwitchOnceStorageKey);

    localStorage.setItem("autoStateStack", JSON.stringify([]));
    localStorage.setItem("teleopStateStack", JSON.stringify([]));

    const nextRoute = getNextRoute('gameStart') || '/auto-scoring';
    navigate(nextRoute, {
      state: {
        inputs: {
          matchNumber,
          matchType,
          alliance,
          scoutName: currentScout,
          selectTeam,
          eventKey,
          scoutOptions,
        },
        ...(isRescoutMode && {
          rescout: {
            isRescout: true,
            matchNumber: rescoutMatch,
            teamNumber: rescoutTeams.length > 0 ? rescoutTeams[currentTeamIndex] : rescoutTeam,
            alliance: rescoutAlliance,
            eventKey: rescoutEventKey,
            teams: rescoutTeams,
            currentTeamIndex,
          },
        }),
      },
    });
  };

  const handleGoBack = () => {
    navigate("/");
  };



  useEffect(() => {
    if (!matchNumber) return;
    const timeout = setTimeout(() => {
      localStorage.setItem("currentMatchNumber", matchNumber);
    }, 500);
    return () => clearTimeout(timeout);
  }, [matchNumber]);

  // Determine view mode
  const isDataOnly = currentScoutRoles.includes('dataScouter') && !currentScoutRoles.includes('commentScouter');

  // Disable button condition logic extracted
  const isButtonDisabled = useMemo(() => {
    if (isRescoutMode) return false;
    const isCommentOnly = currentScoutRoles.includes('commentScouter') && !currentScoutRoles.includes('dataScouter');
    return (!matchNumber || !alliance || !currentScout || !eventKey || (!selectTeam && !isCommentOnly));
  }, [isRescoutMode, currentScoutRoles, matchNumber, alliance, currentScout, eventKey, selectTeam]);

  // Data-only scouter view
  if (isDataOnly) {
    return (
      <div className="min-h-screen pt-12 w-full flex flex-col items-center px-4 pb-24 2xl:pb-6">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold pb-4">Game Start (Data Scouter)</h1>
        </div>
        <div className="flex flex-col items-center gap-6 max-w-2xl w-full flex-1 pb-8 md:pb-4">
          {currentScout && (
            <Card className="w-full">
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Scouting as <span className="font-medium">{currentScout}</span> ({ROLE_LABELS.dataScouter.label})
                </div>
              </CardContent>
            </Card>
          )}
          <FormCard>
            <GameStartInputSection
              eventKey={eventKey}
              setEventKey={setEventKey}
              matchNumber={matchNumber}
              setMatchNumber={setMatchNumber}
              debouncedMatchNumber={debouncedMatchNumber}
              selectTeam={selectTeam}
              setSelectTeam={setSelectTeam}
              stationInfo={stationInfo}
              assignmentSlot={assignmentSlot}
            />
          </FormCard>
          <ActionButtons onBack={handleGoBack} onStart={handleStartScouting} disabled={isButtonDisabled} />
        </div>
      </div>
    );
  }

  // Full scouter view
  return (
    <div className="min-h-screen pt-12 w-full flex flex-col items-center px-4 pb-24 2xl:pb-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold pb-4">Game Start</h1>
      </div>
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full flex-1 pb-8 md:pb-4">

        {/* Header sections: warnings, role info, scout info */}
        <HeaderSection
          currentScout={currentScout}
          currentScoutRoles={currentScoutRoles}
          showWarning={!currentScout}
          scoutOptions={scoutOptions}
          onScoutOptionChange={handleScoutOptionChange}
          customScoutOptionsContent={ui.ScoutOptionsContent}
        />

        {/* Re-scout banner if in rescout mode */}
        {isRescoutMode && (
          <RescoutBanner
            eventKey={rescoutEventKey || ""}
            matchNumber={rescoutMatch || ""}
            teamNumber={rescoutTeams.length > 0 ? rescoutTeams[currentTeamIndex] : rescoutTeam || ""}
            currentTeamIndex={currentTeamIndex}
            totalTeams={rescoutTeams.length}
          />
        )}

        {/* Main form - all inputs together */}
        <FormCard>
          <GameStartInputSection
            eventKey={eventKey}
            setEventKey={setEventKey}
            matchNumber={matchNumber}
            setMatchNumber={setMatchNumber}
            debouncedMatchNumber={debouncedMatchNumber}
            selectTeam={selectTeam}
            setSelectTeam={setSelectTeam}
            stationInfo={stationInfo}
            assignmentSlot={assignmentSlot}
          />

          <MatchTypeSelector
            matchType={matchType}
            setMatchType={setMatchType}
            matchNumber={matchNumber}
            setMatchNumber={setMatchNumber}
            isRescoutMode={isRescoutMode}
          />

          <AllianceSelector
            alliance={alliance as "red" | "blue" | ""}
            setAlliance={setAlliance as (a: "red" | "blue" | "") => void}
            isRescoutMode={isRescoutMode}
          />

          <PredictionSelector
            predictedWinner={predictedWinner}
            onChange={handlePredictionChange}
            isRescoutMode={isRescoutMode}
          />
        </FormCard>

        {/* Action buttons */}
        <ActionButtons onBack={handleGoBack} onStart={handleStartScouting} disabled={isButtonDisabled} />

        {/* Status indicator when ready */}
        {matchNumber && alliance && selectTeam && currentScout && eventKey && (
          <StatusCard
            eventKey={eventKey}
            matchNumber={matchNumber}
            alliance={alliance}
            selectTeam={selectTeam}
            currentScout={currentScout}
          />
        )}

        {/* Bottom spacing for mobile */}
        <div className="h-8 md:h-6" />
      </div>
    </div>
  );
};

export default GameStartPage;
