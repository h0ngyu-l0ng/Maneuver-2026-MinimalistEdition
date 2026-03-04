import React from "react";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Label } from "@/core/components/ui/label";

interface Props {
  alliance: "red" | "blue" | "";
  setAlliance: (a: "red" | "blue" | "") => void;
  isRescoutMode: boolean;
}

const AllianceSelector: React.FC<Props> = ({
  alliance,
  setAlliance,
  isRescoutMode,
}) => {
  return (
    <div className="space-y-2">
      <Label>Alliance</Label>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={alliance === "red" ? "default" : "outline"}
          onClick={() => setAlliance("red")}
          disabled={isRescoutMode}
          className={`h-12 text-lg font-semibold ${alliance === "red"
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            } ${isRescoutMode ? 'cursor-not-allowed' : ''}`}
        >
          <Badge
            variant={alliance === "red" ? "secondary" : "destructive"}
            className={`w-3 h-3 p-0 mr-2 ${alliance === "red" ? "bg-white" : "bg-red-500"}`}
          />
          Red Alliance
        </Button>
        <Button
          variant={alliance === "blue" ? "default" : "outline"}
          onClick={() => setAlliance("blue")}
          disabled={isRescoutMode}
          className={`h-12 text-lg font-semibold ${alliance === "blue"
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
            } ${isRescoutMode ? 'cursor-not-allowed' : ''}`}
        >
          <Badge
            variant={alliance === "blue" ? "secondary" : "default"}
            className={`w-3 h-3 p-0 mr-2 ${alliance === "blue" ? "bg-white" : "bg-blue-500"}`}
          />
          Blue Alliance
        </Button>
      </div>
    </div>
  );
};

export default AllianceSelector;