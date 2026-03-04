import { useState, useMemo } from "react";
import { useScout } from "@/core/contexts/ScoutContext";
import { SCOUT_ROLES, ScoutRole } from "@/core/types/scoutRole";
import { ROLE_LABELS } from "@/core/types/scoutMetaData";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { Check, Trash2 } from "lucide-react";
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

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Scouts</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create or Select Scout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Enter scout name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              {SCOUT_ROLES.map(role => {
                const active = newRoles.includes(role);
                const short = (ROLE_LABELS[role]?.label || role)
                  .slice(0, 3)
                  .toUpperCase();
                return (
                  <button
                    key={role}
                    onClick={() => handleToggleNewRole(role)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-md border transition",
                      active
                        ? "bg-primary text-primary-foreground border-transparent"
                        : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
                    )}
                    aria-pressed={active}
                    title={ROLE_LABELS[role]?.label || role}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
            <Button onClick={handleCreate}>Create Scout</Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4">
        <Input
          placeholder="Filter scouts..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <div className="space-y-2">
        {filteredScouts.map(scout => (
          <div
            key={scout}
            className="flex items-center justify-between border rounded p-2"
          >
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setCurrentScout(scout)}
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  currentScout === scout ? "opacity-100" : "opacity-0"
                )}
              />
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-muted">
                  {scout
                    .split(" ")
                    .map(w => w.charAt(0).toUpperCase())
                    .join("")
                    .slice(0, 3)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{scout}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {(ROLE_LABELS as any as Record<ScoutRole, any>) &&
                  Object.keys(ROLE_LABELS).map((role) => {
                    const r = role as ScoutRole;
                    const active = currentScout === scout &&
                      currentScoutRoles?.includes(r);
                    const short = (ROLE_LABELS[r]?.label || r)
                      .slice(0, 3)
                      .toUpperCase();
                    return (
                      <button
                        key={r}
                        onClick={async e => {
                          e.stopPropagation();
                          await toggleScoutRoleFor(scout, r);
                        }}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-md border transition",
                          active
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted"
                        )}
                        aria-pressed={active}
                        title={ROLE_LABELS[r]?.label || r}
                      >
                        {short}
                      </button>
                    );
                  })}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => await removeScout(scout)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
