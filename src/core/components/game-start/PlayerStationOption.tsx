import { Button } from "@/core/components/ui/button";
import { Settings2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover";
import { useScout } from "@/core/contexts/ScoutContext";
import { convertTeamRole } from "@/core/lib/utils";
import { useState } from "react";

const stations = [
  { value: "unassigned", label: "Unassigned" },
  { value: "red-1", label: "Red 1" },
  { value: "red-2", label: "Red 2" },
  { value: "red-3", label: "Red 3" },
  { value: "blue-1", label: "Blue 1" },
  { value: "blue-2", label: "Blue 2" },
  { value: "blue-3", label: "Blue 3" },
];

export function PlayerStationSheet() {
  const { playerStation, setPlayerStation } = useScout();
  const [open, setOpen] = useState(false);

  const handlePlayerStationChange = (value: string) => {
    setPlayerStation(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>

      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          {playerStation ? convertTeamRole(playerStation) : "(Auto) Alliance #"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-2">
        <div className="space-y-1">
          {stations.map((station) => (
            <button
              key={station.value}
              onClick={() => handlePlayerStationChange(station.value)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                playerStation === station.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {station.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
