import { useState, useMemo } from "react";
import { useScout } from "@/core/contexts/ScoutContext";
import { SCOUT_ROLES, ScoutRole } from "@/core/types/scoutRole";
import { ROLE_LABELS } from "@/core/types/scoutMetaData";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Check, Trash2, Users } from "lucide-react";
import { cn } from "@/core/lib/utils";

export default function ScoutProfilesPage() {
  const {
    currentScout,
    scoutsList,
    addScout,
    removeScout,
    setCurrentScout,
    currentScoutRoles,
    toggleScoutRoleFor,
    updateScoutRoles,
  } = useScout();

  const [filter, setFilter] = useState("");
  const [newName, setNewName] = useState("");
  const [newRoles, setNewRoles] = useState<ScoutRole[]>([]);

  const filteredScouts = useMemo(() => {
    const lower = filter.toLowerCase();
    return scoutsList.filter(s => s.toLowerCase().includes(lower));
  }, [scoutsList, filter]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await addScout(newName.trim());
    if (newRoles.length) {
      // addScout sets the current scout; update roles for it
      await updateScoutRoles(newRoles as ScoutRole[]);
    }
    setNewName("");
    setNewRoles([]);
  };

  const handleToggleNewRole = (role: ScoutRole) => {
    setNewRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const getScoutInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w.charAt(0).toUpperCase())
      .join('')
      .slice(0, 3);
  };

  const getRoleDisplay = (role: ScoutRole) => {
    const label = ROLE_LABELS[role]?.label || role;
    return label;
  };

  return (
    <div className="min-h-screen container mx-auto px-4 pt-12 pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Manage Scout Profiles</h1>
      </div>

      {/* Create New Scout Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Scout Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Enter scout name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full"
            />
            
            <div>
              <label className="text-sm font-medium block mb-2">Assign Roles (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {SCOUT_ROLES.map(role => {
                  const active = newRoles.includes(role);
                  const label = getRoleDisplay(role);
                  return (
                    <button
                      key={role}
                      onClick={() => handleToggleNewRole(role)}
                      className={cn(
                        "text-xs px-3 py-1 rounded-md border transition whitespace-nowrap",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/60 text-muted-foreground border-muted hover:bg-muted"
                      )}
                      aria-pressed={active}
                      title={label}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create Scout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search/Filter */}
      <div className="flex gap-2">
        <Input
          placeholder="Filter scouts by name..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full max-w-sm"
        />
        <span className="text-sm text-muted-foreground self-center">
          {filteredScouts.length} of {scoutsList.length}
        </span>
      </div>

      {/* Scouts List */}
      <div className="space-y-2">
        {filteredScouts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No scouts found</p>
            </CardContent>
          </Card>
        ) : (
          filteredScouts.map(scout => (
            <Card key={scout} className="hover:bg-accent/50 transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => setCurrentScout(scout)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          "font-semibold text-sm",
                          currentScout === scout ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {getScoutInitials(scout)}
                        </AvatarFallback>
                      </Avatar>
                      {currentScout === scout && (
                        <Check className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{scout}</div>
                      {currentScout === scout && (
                        <div className="text-xs text-muted-foreground">Current Scout</div>
                      )}
                    </div>
                  </div>

                  {/* Role Display */}
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(Object.keys(ROLE_LABELS) as ScoutRole[]).map((role) => {
                      const active = currentScout === scout && currentScoutRoles?.includes(role);
                      const label = getRoleDisplay(role);
                      const short = label.slice(0, 3).toUpperCase();
                      
                      return (
                        <button
                          key={role}
                          onClick={async e => {
                            e.stopPropagation();
                            await toggleScoutRoleFor(scout, role);
                          }}
                          className={cn(
                            "text-xs px-2 py-1 rounded-md border transition whitespace-nowrap",
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/60 text-muted-foreground border-muted hover:bg-muted"
                          )}
                          title={label}
                        >
                          {short}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async e => {
                      e.stopPropagation();
                      await removeScout(scout);
                    }}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
