import * as React from "react"
import { Settings, SquarePen } from "lucide-react"

// import { NavDocuments } from "@/core/components/dashboard/nav-documents"
import { NavMain } from "@/core/components/dashboard/nav-main"
// import { NavSecondary } from "@/core/components/dashboard/nav-secondary"
import { NavUser } from "@/core/components/dashboard/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/core/components/ui/sidebar"
import { Separator } from "@/core/components/ui/separator"
import { haptics } from "@/core/lib/haptics"
import { ScoutRole } from "@/core/types/scoutRole"

const data = {
  navMain: [
    // {
    //   title: "Data Actions",
    //   url: "/settings",
    //   icon: Settings,
    //   items: [
    //     {
    //       title: "Clear Data",
    //       url: "/clear-data",
    //     },
    //     {
    //       title: "Convert Scouting JSON Data",
    //       url: "/parse-data",
    //     }
    //   ]
    // },

    {
      title: "Data Actions",
      url: "#",
      icon: Settings,
      items: [

        {
          title: "API Data",
          url: "/api-data",
        },
        {
          title: "WiFi Transfer (Beta)",
          url: "/peer-transfer",
        },

        {
          title: "Match & Pit Assignments",
          url: "/pit-assignments",

          requiredRoles: ["leadership", "mentors"] as ScoutRole[]
        }


      ]
    },




    {
      title: "Strategy",
      url: "#",
      icon: SquarePen,
      items: [
        {
          title: "Match Strategy",
          url: "/match-strategy",
        },

        {
          title: "Overview: Team Performance",
          url: "/strategy-overview",
        },
        {
          title: "Individual Team Stats",
          url: "/team-stats",
        },

        {
          title: "Scout Data Validation",
          url: "/match-validation",
        },

        {
          title: "Pick Lists",
          url: "/pick-list",
        }
      ],
    },



    {
      title: "Archived/Unused Features",
      url: "#",
      items: [
        {
          title: "Clear Data",
          url: "/clear-data",
        },
        {
          title: "JSON Data Transfer",
          url: "/json-transfer",
        },
        {
          title: "QR Data Transfer",
          url: "/qr-transfer",
        },


        {
          title: "Achievements",
          url: "/achievements",
          requiredRoles: ["unlockLeaderboard"] as ScoutRole[]
        },


        {
          title: "Scout Leaderboard",
          url: "/scout-management",
          requiredRoles: ["unlockLeaderboard"] as ScoutRole[]
        },

        ...(import.meta.env.DEV ? [
          {
            title: "Dev Utilities",
            url: "/dev-utilities",
          }] : [])

      ],

    },
  ],



  navSecondary: [
    {
      title: "Get Help (WIP)",
      url: "#",
      // icon: IconHelp,
    },
  ],

  documents: [
    {
      name: "Saved Match Strategies (WIP)",
      url: "#",
      // icon: IconDatabase,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { setOpenMobile } = useSidebar()
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const minSwipeDistance = 60

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX < -minSwipeDistance) {
        e.preventDefault()
        haptics.light()
        setOpenMobile(false)
      }
    }

    touchStartRef.current = null
  }

  React.useEffect(() => {
    const handleGlobalTouchStart = (e: TouchEvent) => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]')
      if (sidebar && !sidebar.contains(e.target as Node)) {
        const touch = e.touches[0]
        if (!touch) return

        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
      }
    }

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const sidebar = document.querySelector('[data-sidebar="sidebar"]')
      if (sidebar && !sidebar.contains(e.target as Node)) {
        const touch = e.changedTouches[0]
        if (!touch) return

        const deltaX = touch.clientX - touchStartRef.current.x
        const deltaY = touch.clientY - touchStartRef.current.y
        const minSwipeDistance = 60

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX < -minSwipeDistance) {
            e.preventDefault()
            haptics.light()
            setOpenMobile(false)
          }
        }
      }

      touchStartRef.current = null
    }

    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true })
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [setOpenMobile])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button] h-fit"
            >
              
            </SidebarMenuButton>
            <Separator className="my-1" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>


    </Sidebar>
  )
}