import { useState } from "react"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Button } from "@/core/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/components/ui/command"
import { Check, Plus, Trash2 } from "lucide-react"
import { cn } from "@/core/lib/utils"
import { AddScoutForm } from "./AddScoutForm"
import { ScoutRole } from "@/core/types/scoutRole"
import { useScout } from "@/core/contexts/ScoutContext"
import { ROLE_LABELS } from "@/core/types/scoutMetaData"
// import { ScoutMetaData } from "@/core/types/scoutMetaData"

interface ScoutSelectorContentProps {
  currentScout: string
  scoutsList: string[]
  onScoutSelect: (name: string) => Promise<void>
  onScoutRemove: (name: string) => Promise<void>
  onClose?: () => void
}

export function ScoutSelectorContent({ 
  currentScout, 
  scoutsList, 
  onScoutSelect, 
  onScoutRemove,
  onClose
}: ScoutSelectorContentProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const { currentScoutRoles, toggleScoutRoleFor } = useScout()

  const getScoutName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 3) // Limit to 3 characters
  }

  const handleScoutSelect = async (name: string) => {
    await onScoutSelect(name)
    onClose?.()
    setShowAddForm(false)
  }

  const handleAddScout = async (name: string) => {
    await onScoutSelect(name) // This will create and select the scout
    onClose?.()
    setShowAddForm(false)
    setSearchValue("")
  }

  const handleCancelAdd = () => {
    setShowAddForm(false)
    setSearchValue("")
  }

  return (
    <Command shouldFilter={true}>
      {!showAddForm ? (
        <>
          <CommandInput 
            placeholder="Search scouts..."
            onInput={(e) => {
              const target = e.target as HTMLInputElement
              setSearchValue(target.value)
            }}
          />

          
          <CommandEmpty>
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground mb-2">No scouts found</p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowAddForm(true)
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Scout
              </Button>
            </div>
          </CommandEmpty>


          <CommandList>
            <CommandGroup>
              {scoutsList.map((scout) => (
                <CommandItem
                  key={scout}
                  value={scout}
                  onSelect={() => handleScoutSelect(scout)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentScout === scout ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-muted">
                            {getScoutName(scout)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">{scout}</div>
                      </div>

                      <div className="mt-1 flex gap-1">
                        {(Object.keys(ROLE_LABELS) as ScoutRole[]).map((role) => {
                          const active = currentScout === scout ? currentScoutRoles?.includes(role) : false
                          const short = (ROLE_LABELS[role]?.label || role).slice(0, 3).toUpperCase()
                          return (
                            <button
                              key={role}
                              onClick={async (e) => {
                                e.stopPropagation()
                                // Toggle role for this scout
                                await toggleScoutRoleFor(scout, role)
                              }}
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
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await onScoutRemove(scout)
                    }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </CommandItem>
              ))}
            </CommandGroup>
            

            {scoutsList.length > 0 && (
              <CommandGroup>
                <div 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowAddForm(true)
                  }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Scout
                </div>
              </CommandGroup>
            )}
          </CommandList>

        </>
      ) : (
        <AddScoutForm 
          onAdd={handleAddScout}
          onCancel={handleCancelAdd}
          initialValue={searchValue}
        />
      )}
    </Command>
  )
}
