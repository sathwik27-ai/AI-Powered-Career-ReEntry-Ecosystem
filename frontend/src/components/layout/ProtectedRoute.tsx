import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../api/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-plum-200 border-t-jelly-purple" />
          <p className="text-sm font-bold text-ink">Loading ReStartHer...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Onboarding gate: When a new learner logs in, require profile & background intake first
  if (
    user.role === "listener" &&
    !user.has_profile &&
    location.pathname !== "/app/onboarding" &&
    location.pathname !== "/app/intake"
  ) {
    return <Navigate to="/app/onboarding" replace />;
  }

  return <>{children}</>;
}
