import { Button } from "@/core/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/core/components/ui/sheet";
import { Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { ModeToggle } from "../mode-toggle";
import { useScout } from "@/core/contexts/ScoutContext";
import { convertTeamRole } from "@/core/lib/utils";
import { useEffect } from "react";


export function PlayerStationSheet() {
  const { playerStation, setPlayerStation } = useScout();
  const handlePlayerStationChange = (value: string) => {
    setPlayerStation(value);
  };

;

  useEffect(() => {
      if (playerStation) {
        const element = document.getElementById(playerStation.toLowerCase().replace(" ", ""));
        if (element) {
          (element as HTMLInputElement).checked = true;
        }
      }
    }, [playerStation]);

  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          (Auto) Alliance #
        </Button>
      </SheetTrigger>


      <Select
              value={playerStation}
              onValueChange={handlePlayerStationChange}
            >

              <SelectTrigger>
                <SelectValue placeholder={convertTeamRole(playerStation) || "Role"} />
              </SelectTrigger>

              <SelectContent>
                <SelectItem className="text-lg" value="lead">Lead</SelectItem>
                <SelectItem className="text-lg" value="red-1">Red 1</SelectItem>
                <SelectItem className="text-lg" value="red-2">Red 2</SelectItem>
                <SelectItem className="text-lg" value="red-3">Red 3</SelectItem>
                <SelectItem className="text-lg" value="blue-1">Blue 1</SelectItem>
                <SelectItem className="text-lg" value="blue-2">Blue 2</SelectItem>
                <SelectItem className="text-lg" value="blue-3">Blue 3</SelectItem>
              </SelectContent>

                        <ModeToggle />


            </Select>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">


        </SheetContent>

</Sheet>
);
}
