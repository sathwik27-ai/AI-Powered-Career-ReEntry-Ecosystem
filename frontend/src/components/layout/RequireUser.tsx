import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";

/** Pages that need a ReStartHer user send visitors without one back to the landing page. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  if (userId === null) return <Navigate to="/" replace />;
  return <>{children}</>;
}
