import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";

interface Props {
  matchType: "qm" | "sf" | "f";
  setMatchType: (v: "qm" | "sf" | "f") => void;
  matchNumber: string;
  setMatchNumber: (n: string) => void;
  isRescoutMode: boolean;
}

const MatchTypeSelector: React.FC<Props> = ({
  matchType,
  setMatchType,
  matchNumber,
  setMatchNumber,
  isRescoutMode,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="match-number">Match Number</Label>
        <span className="text-xs text-muted-foreground">
          Auto-increments after each match
        </span>
      </div>
      <div className="flex gap-2">
        <Select
          value={matchType}
          onValueChange={(value) => setMatchType(value as "qm" | "sf" | "f")}
          disabled={isRescoutMode}
        >
          <SelectTrigger className="w-24 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="qm">Qual</SelectItem>
            <SelectItem value="sf">Semi</SelectItem>
            <SelectItem value="f">Final</SelectItem>
          </SelectContent>
        </Select>
        <Input
          id="match-number"
          type="number"
          inputMode="numeric"
          placeholder={
            matchType === "qm"
              ? "e.g., 24"
              : matchType === "sf"
              ? "e.g., 1"
              : "e.g., 1"
          }
          value={matchNumber}
          onChange={(e) => setMatchNumber(e.target.value)}
          className={`text-lg flex-1 h-12 ${isRescoutMode ? 'bg-muted cursor-not-allowed' : ''}`}
          disabled={isRescoutMode}
        />
      </div>
      {matchType === "sf" && (
        <p className="text-xs text-muted-foreground">
          Enter semifinal # (1-13) → Creates sf#m1
        </p>
      )}
      {matchType === "f" && (
        <p className="text-xs text-muted-foreground">
          Enter match # (1-3) → Creates f1m#
        </p>
      )}
    </div>
  );
};

export default MatchTypeSelector;