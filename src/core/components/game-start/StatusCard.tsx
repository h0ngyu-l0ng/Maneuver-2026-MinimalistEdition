import React from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";

interface Props {
  matchNumber?: string | null;
  alliance?: "red" | "blue" | "";
  selectTeam?: string | null;
  currentScout?: string | null;
  eventKey?: string | null;
}

const StatusCard: React.FC<Props> = ({
  matchNumber,
  alliance,
  selectTeam,
  currentScout,
  eventKey,
}) => {
  if (!matchNumber || !alliance || !selectTeam || !currentScout || !eventKey) {
    return null;
  }

  return (
    <Card className="w-full border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600">Ready</Badge>
          <span className="text-sm text-green-700 dark:text-green-300">
            {eventKey} • Match {matchNumber} • {alliance.charAt(0).toUpperCase() + alliance.slice(1)} Alliance
            • Team {selectTeam} • {currentScout}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusCard;