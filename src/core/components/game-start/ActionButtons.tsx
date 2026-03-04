import React from "react";
import { Button } from "@/core/components/ui/button";

interface Props {
  onBack: () => void;
  onStart: () => void;
  disabled?: boolean;
}

const ActionButtons: React.FC<Props> = ({ onBack, onStart, disabled }) => {
  return (
    <div className="flex gap-4 w-full">
      <Button
        variant="outline"
        onClick={onBack}
        className="flex-1 h-12 text-lg"
      >
        Back
      </Button>
      <Button
        onClick={onStart}
        className="flex-2 h-12 text-lg font-semibold"
        disabled={disabled}
      >
        Start Scouting
      </Button>
    </div>
  );
};

export default ActionButtons;