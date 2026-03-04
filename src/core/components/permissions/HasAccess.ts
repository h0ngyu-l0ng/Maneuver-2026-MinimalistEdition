import { ScoutRole } from "@/core/types/scoutRole"



export const hasAccess = (
    scoutRoles: ScoutRole[],
    neededRoles?: ScoutRole[],
): boolean => {
    // no states that require specific roles, so allow access
    if (!neededRoles || neededRoles.length === 0) return true

    return neededRoles.some(role => scoutRoles.includes(role))
}