import { Button } from "@/core/components/ui/button";

interface BallsShotCounterProps {
  count: number;
  onChange: (nextCount: number) => void;
  incrementLabel?: string;
}

const BallsShotCounter = ({
  count,
  onChange,
  incrementLabel = "+1 Shot",
}: BallsShotCounterProps) => {
  const safeCount = Math.max(0, count || 0);

  return (
    <div className="space-y-3">
      <div className="text-center text-3xl font-bold">{safeCount}</div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange(Math.max(0, safeCount - 1))}
          disabled={safeCount === 0}
        >
          -1
        </Button>
        <Button type="button" onClick={() => onChange(safeCount + 1)}>
          {incrementLabel}
        </Button>
      </div>
    </div>
  );
};

export default BallsShotCounter;