import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { saveScoutingEntries } from "@/core/db/database";
import { toast } from "sonner";

type MatchType = "qm" | "sf" | "f";

interface GameStartInputs {
  matchNumber: string;
  matchType: MatchType;
  alliance: "red" | "blue";
  scoutName: string;
  eventKey: string;
}

interface LocationState {
  inputs?: GameStartInputs;
}

interface MatchDataItem {
  redAlliance?: Array<string | number>;
  blueAlliance?: Array<string | number>;
}

const buildMatchKey = (matchType: MatchType, matchNumber: string): { matchKey: string; numericMatch: number } => {
  const numericMatch = parseInt(matchNumber, 10) || 0;

  if (matchType === "sf") {
    return { matchKey: `sf${matchNumber}m1`, numericMatch };
  }

  if (matchType === "f") {
    return { matchKey: `f1m${matchNumber}`, numericMatch };
  }

  return { matchKey: `qm${matchNumber}`, numericMatch };
};

const CommentScoutMatchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const inputs = state?.inputs;

  const teams = useMemo(() => {
    if (!inputs?.alliance || !inputs?.matchNumber) {
      return [] as string[];
    }

    try {
      const matchDataRaw = localStorage.getItem("matchData");
      const matchData = (matchDataRaw ? JSON.parse(matchDataRaw) : []) as MatchDataItem[];

      const matchIndex = Math.max(0, (parseInt(inputs.matchNumber, 10) || 1) - 1);
      const selectedMatch = matchData[matchIndex];

      if (!selectedMatch) {
        return [];
      }

      const allianceTeams = inputs.alliance === "red"
        ? selectedMatch.redAlliance || []
        : selectedMatch.blueAlliance || [];

      return allianceTeams.slice(0, 3).map((team) => String(team));
    } catch {
      return [];
    }
  }, [inputs?.alliance, inputs?.matchNumber]);

  const [commentsByTeam, setCommentsByTeam] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!inputs) {
    return (
      <div className="min-h-screen container mx-auto px-4 pt-12 pb-24 max-w-2xl">
        <Alert>
          <AlertDescription>
            Missing match context. Start from Game Start page.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/game-start")}>Go to Game Start</Button>
        </div>
      </div>
    );
  }

  const handleCommentChange = (team: string, value: string) => {
    setCommentsByTeam((prev) => ({ ...prev, [team]: value }));
  };

  const handleSave = async () => {
    if (!inputs.eventKey || !inputs.matchNumber || !inputs.scoutName || !inputs.alliance) {
      toast.error("Missing match details");
      return;
    }

    if (teams.length !== 3) {
      toast.error("Could not find 3 teams for this alliance and match");
      return;
    }

    const hasAtLeastOneComment = teams.some((team) => (commentsByTeam[team] || "").trim().length > 0);
    if (!hasAtLeastOneComment) {
      toast.error("Add at least one team comment");
      return;
    }

    const { matchKey, numericMatch } = buildMatchKey(inputs.matchType || "qm", inputs.matchNumber);

    const entries = teams.map((team, index) => {
      const parsedTeam = parseInt(team, 10);
      return {
        id: `${inputs.eventKey.toLowerCase()}::${matchKey}::${team}::${inputs.alliance}::comment::${inputs.scoutName}::${index + 1}`,
        teamNumber: Number.isFinite(parsedTeam) ? parsedTeam : 0,
        matchNumber: numericMatch,
        matchKey,
        allianceColor: inputs.alliance,
        scoutName: inputs.scoutName,
        eventKey: inputs.eventKey.toLowerCase(),
        gameData: {},
        timestamp: Date.now(),
        comments: (commentsByTeam[team] || "").trim(),
      };
    });

    setIsSaving(true);
    try {
      await saveScoutingEntries(entries);
      const nextMatch = (parseInt(inputs.matchNumber, 10) || 0) + 1;
      localStorage.setItem("currentMatchNumber", String(nextMatch));
      toast.success("Comment scout notes saved");
      navigate("/game-start");
    } catch (error) {
      console.error("Failed to save comment scout notes", error);
      toast.error("Failed to save comments");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pt-12 pb-24">
      <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comment Scout Match</h1>
        <p className="text-muted-foreground">
          Match {inputs.matchNumber} • {inputs.eventKey}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Alliance</span>
            <Badge variant={inputs.alliance === "red" ? "destructive" : "default"}>
              {inputs.alliance.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teams.length === 0 && (
            <Alert>
              <AlertDescription>
                No match alliance teams found. Load match data first from API Data or Demo Data.
              </AlertDescription>
            </Alert>
          )}

          {teams.map((team) => (
            <div key={team} className="space-y-2">
              <Label htmlFor={`comment-${team}`}>Team {team}</Label>
              <Textarea
                id={`comment-${team}`}
                value={commentsByTeam[team] || ""}
                onChange={(event) => handleCommentChange(team, event.target.value)}
                placeholder={`Comment for Team ${team}`}
                rows={4}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate("/game-start")}>Back</Button>
        <Button className="flex-1" onClick={handleSave} disabled={isSaving || teams.length !== 3}>
          {isSaving ? "Saving..." : "Save Comments"}
        </Button>
      </div>
      </div>
    </div>
  );
};

export default CommentScoutMatchPage;
