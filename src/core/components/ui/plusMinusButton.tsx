import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/lib/utils";

interface PlusMinusButtonProps {
  count: number;
  onChange: (nextCount: number) => void;
  decrementLabel?: string;
  incrementLabel?: string;
  step?: number;
  min?: number;
  buttonClassName?: string;
  numberBetweenButtons?: boolean;
}

const PlusMinusButton = ({
  count,
  onChange,
  decrementLabel = "-1",
  incrementLabel = "+1",
  step = 1,
  min = 0,
  buttonClassName,
  numberBetweenButtons = false,
}: PlusMinusButtonProps) => {
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeCount = Math.max(safeMin, count || 0);
  const nextDecrement = Math.max(safeMin, safeCount - safeStep);
  const nextIncrement = safeCount + safeStep;

  return (
    <div className="space-y-4">
      {numberBetweenButtons ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
          <Button
            type="button"
            variant="outline"
            className={cn("h-14 text-xl", buttonClassName)}
            onClick={() => onChange(nextDecrement)}
            disabled={safeCount <= safeMin}
          >
            {decrementLabel}
          </Button>
          <div className="min-w-24 px-3 text-center text-5xl font-bold leading-none md:min-w-28 md:text-6xl">{safeCount}</div>
          <Button
            type="button"
            className={cn("h-14 text-xl", buttonClassName)}
            onClick={() => onChange(nextIncrement)}
          >
            {incrementLabel}
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center text-4xl font-bold leading-none">{safeCount}</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn("h-14 text-xl", buttonClassName)}
              onClick={() => onChange(nextDecrement)}
              disabled={safeCount <= safeMin}
            >
              {decrementLabel}
            </Button>
            <Button
              type="button"
              className={cn("h-14 text-xl", buttonClassName)}
              onClick={() => onChange(nextIncrement)}
            >
              {incrementLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PlusMinusButton;