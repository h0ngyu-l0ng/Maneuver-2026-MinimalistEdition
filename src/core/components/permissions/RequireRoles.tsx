import  { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useScout } from "@/core/contexts/ScoutContext";
import { hasAccess } from "@/core/components/permissions/HasAccess";
import { ScoutRole } from "@/core/types/scoutRole";

interface RequireRolesProps {
  roles?: ScoutRole[];
  children: ReactNode;
}

/**
 * Wraps a component tree and prevents rendering unless the current scout
 * has at least one of the provided roles. If the scout is unauthorized,
 * it will redirect to the home page and show a brief message.
 */
export function RequireRoles({ roles, children }: RequireRolesProps) {
  const { currentScoutRoles } = useScout();

  const allowed = hasAccess(currentScoutRoles, roles);
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
