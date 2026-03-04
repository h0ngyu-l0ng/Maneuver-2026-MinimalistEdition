import { cn } from "@/core/lib/utils";
import { useScout } from "@/core/contexts/ScoutContext";
import { Button, Card, CardContent } from "@/components";
import { useNavigate } from "react-router-dom";
import { hasAccess } from "@/core/components/permissions/HasAccess";
import { SCOUT_ROLES, ScoutRole } from "../types/scoutRole";
import React from "react";
import { ROLE_LABELS } from "../types/scoutMetaData";

/**
 * HomePage Props
 * Game implementations can provide their own logo, version, and demo data handlers
 */
interface HomePageProps {
  // logo?: string;
  appName?: string;
  roleDescription?: string;
  // checkExistingData?: () => Promise<boolean>;
  // demoDataDescription?: string;
  // demoDataStats?: string;
  // demoScheduleStats?: string;

}


const HomePage = ({
  appName = "Scout 2026 Rebuilt",
}: HomePageProps = {}) => {
  const { currentScout, currentScoutRoles, updateScoutRoles, addScout } = useScout();

  // state for new profile creation
  const [newName, setNewName] = React.useState("");
  const [newRoles, setNewRoles] = React.useState<ScoutRole[]>([]);

  const handleRoleToggle = (role: ScoutRole) => {
    setNewRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleCreateProfile = async () => {
    if (!newName.trim()) return;
    await addScout(newName.trim());
    if (newRoles.length) {
      updateScoutRoles(newRoles);
    }
    setNewName("");
    setNewRoles([]);
  };
  const navigate = useNavigate();
  const canManage = hasAccess(currentScoutRoles, ["leadership", "mentors"] as ScoutRole[]);

  return (
    <main className="relative min-h-screen w-full">

<>
      <div className={cn("flex flex-col min-h-screen w-full justify-center items-center gap-6 2xl:pb-6",
        "bg-size-[40px_40px]",
        "bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
      )}>
        <h1 className="text-4xl font-bold">{appName}</h1>
        
        <h2>
          Huge thanks to (<a href="https://github.com/ShinyShips/maneuver-core" target="_blank" rel="noopener noreferrer">FRC Team 3314 Alumni and Strategy Mentor</a>) for
           developing this web app!</h2>
           <h2 className="text-2xl font-semibold">Get Started</h2>
           <h2>
          1. Create a scout profile and then select your role <br/>
            2. Load match data from API Data
        </h2>
        <div/>

        <Card className="w-full max-w-lg mx-4 mt-8">
          <CardContent className="p-6">
              <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold">Create New Scout Profile</h2>
              <p className="text-sm text-muted-foreground">
                Name and optionally select roles before hitting create.</p>

              <input
                className="w-full border rounded px-2 py-1"
                placeholder="Scout name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />

              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                {SCOUT_ROLES.map(role => {
                  const active = newRoles.includes(role);
                  const short = ROLE_LABELS[role]?.label
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleToggle(role)}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md border transition",
                        active
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
                      )}
                      aria-pressed={active}
                      title={role}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>

              <Button onClick={handleCreateProfile} disabled={!newName.trim()}>
                Create Scout Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full max-w-lg mx-4 mt-8">
           <CardContent className="p-6">
              <div className="text-center space-y-4">
              <h2 className="text-lg font-semibold mb-2">Scout Profile</h2>
              {currentScout ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Current: <span className="font-medium text-foreground">{currentScout}</span>
                  </p>
                  {currentScoutRoles && currentScoutRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                      {currentScoutRoles.map(r => (
                        <span
                          key={r}
                          className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No scout selected. Create or select a profile to get started.</p>
              )}

              {canManage && (
                <Button onClick={() => navigate("/scouts-profile")} className="w-full">
                  Manage Scout Profiles
                </Button>
              )}
              </div>
            </CardContent>

        </Card>
      </div>
</>
    </main>
  );
};

export default HomePage;
