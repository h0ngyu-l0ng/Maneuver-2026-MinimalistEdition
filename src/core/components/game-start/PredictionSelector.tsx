import React from "react";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";

interface Props {
  predictedWinner: "red" | "blue" | "none";
  onChange: (prediction: "red" | "blue" | "none") => void;
  isRescoutMode: boolean;
}

const PredictionSelector: React.FC<Props> = ({
  predictedWinner,
  onChange,
  isRescoutMode,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Alliance Prediction (Optional)</Label>
        <span className="text-xs text-muted-foreground">
          {isRescoutMode ? "Locked during re-scout" : "Earn points for correct predictions"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={predictedWinner === "red" ? "default" : "outline"}
          onClick={() => onChange("red")}
          disabled={isRescoutMode}
          className={`h-10 text-sm font-medium ${predictedWinner === "red"
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            }`}
        >
          Red Wins
        </Button>
        <Button
          variant={predictedWinner === "blue" ? "default" : "outline"}
          onClick={() => onChange("blue")}
          disabled={isRescoutMode}
          className={`h-10 text-sm font-medium ${predictedWinner === "blue"
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            }`}
        >
          Blue Wins
        </Button>
        <Button
          variant={predictedWinner === "none" ? "default" : "outline"}
          onClick={() => onChange("none")}
          disabled={isRescoutMode}
          className="h-10 text-sm font-medium"
        >
          No Prediction
        </Button>
      </div>
      {predictedWinner !== "none" && (
        <p className="text-xs text-muted-foreground">
          Predicting <span className="font-medium capitalize">{predictedWinner} Alliance</span> will win this match
        </p>
      )}
    </div>
  );
};

export default PredictionSelector;