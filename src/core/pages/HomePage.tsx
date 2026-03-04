import { cn } from "@/core/lib/utils";
import { useScout } from "@/core/contexts/ScoutContext";
import { SCOUT_ROLES } from "@/core/types/scoutRole";
import { Button, Card, CardContent } from "@/components";

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
  const { currentScout, currentScoutRoles, updateScoutRoles, toggleScoutRole } = useScout();
  const showAssignedRoles = currentScout && (!currentScoutRoles || currentScoutRoles.length === 0) ? false : true;

  return (

    <main className="relative h-screen w-full">
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-6 rounded-md border-2 border-dashed p-6", "bg-size-[40px_40px]")}>
        <h1 className="text-4xl font-bold">{appName}</h1>
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <h2 >
          1. Go to the sidebar to select your scout profile <br />
          2. Select add new scout<br />
          3. Enter your Name<br />
          4. Come back here to select your assigned roles
        </h2>



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
