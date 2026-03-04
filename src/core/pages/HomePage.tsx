import { cn } from "@/core/lib/utils";
import { useScout } from "@/core/contexts/ScoutContext";
import { SCOUT_ROLES, ScoutRole } from "@/core/types/scoutRole";
import { Button, Card, CardContent } from "@/components";
import React from "react";

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
  roleDescription = "Select your assigned roles (ie. comment scouter, data scouter)",
}: HomePageProps = {}) => {
  const { currentScout, currentScoutRoles, updateScoutRoles, toggleScoutRole, addScout } = useScout();
  const showAssignedRoles = currentScout && (!currentScoutRoles || currentScoutRoles.length === 0) ? false : true;

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

  return (

    <main className="relative h-screen w-full">
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-6 rounded-md border-2 border-dashed p-6", "bg-size-[40px_40px]")}>
        <h1 className="text-4xl font-bold">{appName}</h1>
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <h2 >
          1. Enter your name and assign roles below, or
          select/manage scouts using the sidebar link.
        </h2>

        {/* profile creation form */}
        <Card className="w-full max-w-md mx-4 mt-8 scale-75 md:scale-100">
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
                  const short = role.slice(0,3).toUpperCase();
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
                Create Scout
              </Button>
            </div>
          </CardContent>
        </Card>

        {showAssignedRoles && (

          ///create a card
          <Card className="w-full max-w-md mx-4 mt-8 scale-75 md:scale-100">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h2 className="text-lg font-semibold">Select Assigned Roles</h2>
                <p className="text-sm text-muted-foreground">
                  {roleDescription}</p>

                <div className="flex flex-col items-start gap-2 mt-4">
                  {SCOUT_ROLES.map(role => (

                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentScoutRoles.includes(role)}
                        onChange={() => {
                          toggleScoutRole(role);
                        }}
                        className="h-4 w-4"
                      />

                      {role}


                    </label>
                    
                  ))}
                </div>

                <Button onClick={() => {
                  updateScoutRoles(currentScoutRoles);
                }}>
                  Save Roles
                </Button>


              </div>
            </CardContent>
          </Card>
        )}


      </div>


    </main >

  );


};

export default HomePage;
