import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function UnauthorizedPage() {
  const { user } = useAuth();

  const homeUrl = user?.role === "admin" ? "/admin" : user?.role === "trainer" ? "/trainer" : "/app";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper p-6 text-center">
      <div className="card max-w-md p-8 shadow-jelly">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rosewood-100 text-rosewood-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-ink">Access Restricted</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You do not have the required permissions to view this section of ReStartHer.
          {user && (
            <span className="mt-2 block font-medium text-ink">
              Logged in as: <span className="capitalize font-bold text-jelly-purple">{user.role}</span> ({user.email})
            </span>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            to={homeUrl}
            className="jelly-btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-jelly-purple to-jelly-blueberry px-5 py-2.5 text-sm font-bold text-white"
          >
            <Home className="h-4 w-4" />
            Go to Your Dashboard
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold text-ink hover:bg-paper-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
