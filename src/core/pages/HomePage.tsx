import { cn } from "@/core/lib/utils";
import { useScout } from "@/core/contexts/ScoutContext";
import { Button, Card, CardContent } from "@/components";
import { useNavigate } from "react-router-dom";

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
  const { currentScout, currentScoutRoles } = useScout();
  const navigate = useNavigate();

  return (

    <main className="relative h-screen w-full">
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-6 rounded-md border-2 border-dashed p-6", "bg-size-[40px_40px]")}>
        <h1 className="text-4xl font-bold">{appName}</h1>
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <h2>
          1. Select or create a scout profile, or
          select/manage scouts using the sidebar.
        </h2>

        {/* Scout Profile Card */}
        <Card className="w-full max-w-lg mx-4 mt-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Scout Profile</h2>
                
                {currentScout ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-2">
                      Current: <span className="font-medium text-foreground">{currentScout}</span>
                    </p>
                    {currentScoutRoles && currentScoutRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mb-2">
                        {currentScoutRoles.map(role => (
                          <span
                            key={role}
                            className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No scout selected. Create or select a profile to get started.
                  </p>
                )}
              </div>

              <Button onClick={() => navigate("/scouts-profile")} className="w-full">
                Manage Scout Profiles
              </Button>
            </div>
          </CardContent>
        </Card>


      </div>


    </main >

  );


};

export default HomePage;
