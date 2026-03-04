import { Binoculars, Home, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/core/components/ui/sidebar"
import { ModeToggle } from "../mode-toggle"
import { useNavigationConfirm } from "@/core/hooks/useNavigationConfirm";
import { NavigationConfirmDialog } from "@/core/components/NavigationConfirmDialog";
import { ScoutRole } from "@/core/types/scoutRole";
import { useScout } from "@/core/contexts/ScoutContext"
import { hasAccess } from "@/core/components/permissions/HasAccess";

export function NavMain({
  items,
}: {

  items: {

    title: string
    url: string
    requiredRoles?: ScoutRole[]
    icon?: LucideIcon
    isActive?: boolean

    items?: {
      title: string
      url: string
      requiredRoles?: ScoutRole[]
    }[]

  }[]
}) {


  const { currentScoutRoles = [] } = useScout()


  const { isMobile, setOpenMobile } = useSidebar();
  const {
    confirmNavigation,
    handleConfirm,
    handleCancel,
    isConfirmDialogOpen,
    pendingDestinationLabel
  } = useNavigationConfirm();

  // navigate to the destination page
  const proceedClick = (url?: string) => {
    const destination = url || "/";
    const label = url === "/" ? "Home" : "this page";

    if (confirmNavigation(destination, label)) {
      // Navigation was allowed immediately
      if (isMobile) {
        setOpenMobile(false);
      }
    }
    // If navigation was blocked, confirmNavigation will show the dialog
  };

  // Handler for sub-menu clicks
  const handleSubItemClick = (url: string) => {
    const label = url.split('/').pop() || "this page";

    if (confirmNavigation(url, label)) {
      // Navigation was allowed immediately
      if (isMobile) {
        setOpenMobile(false);
      }
    }
    // If navigation was blocked, confirmNavigation will show the dialog
  };

  // Close sidebar when navigation is confirmed
  const handleConfirmNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    handleConfirm();
  };

  const visibleItems = items.map(item => {
    const parentAccess = hasAccess(currentScoutRoles, item.requiredRoles)

    const subAccess = item.items
      ?.filter(sub => hasAccess(currentScoutRoles, sub.requiredRoles))

    return { ...item, items: subAccess || [] ,visible:parentAccess}

  }).filter(item => item.visible)


  return (
    <>
      <SidebarGroup>

        <SidebarMenuItem className="flex items-center pb-4">
          <div className="flex w-full gap-2">
            <ModeToggle />
          </div>
        </SidebarMenuItem>

        <SidebarGroupLabel>Platform</SidebarGroupLabel>

        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton tooltip={"Home"} onClick={() => proceedClick("/")}>
              <Home />
              <span>Get Started</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton tooltip={"Match Scout"} onClick={() => proceedClick("/game-start")}>
              <Binoculars />
              <span>Match Scout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton tooltip={"Pit Scout"} onClick={() => proceedClick("/pit-scouting")}>
              <Binoculars />
              <span>Pit Scout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>


          {visibleItems.map(item => (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {item.items.length > 0 && (
                  <CollapsibleContent>
                    <SidebarMenuSub>

                      {item.items.map(subItem => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <button onClick={() => handleSubItemClick(subItem.url)}>
                              <span>{subItem.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}

                    </SidebarMenuSub>
                  </CollapsibleContent>

                )}
              </SidebarMenuItem>
            </Collapsible>
          ))}

        </SidebarMenu>
      </SidebarGroup>

      <NavigationConfirmDialog
        open={isConfirmDialogOpen}
        onConfirm={handleConfirmNavigation}
        onCancel={handleCancel}
        destinationLabel={pendingDestinationLabel}
      />
    </>
  )
}