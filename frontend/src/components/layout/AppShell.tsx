import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, UserRound } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { Wordmark } from "./Wordmark";
import { cx } from "@/components/ui/primitives";

export const NAV = [
  { to: "/dashboard", label: "My plan" },
  { to: "/skills", label: "Skills" },
  { to: "/learning", label: "Learning" },
  { to: "/interview", label: "Interview" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/applications", label: "Applications" },
  { to: "/agents", label: "How it works" },
] as const;

function ModeBadge() {
  const { health, apiOnline } = useSession();
  if (apiOnline === false)
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rosewood-600">
        <span className="h-1.5 w-1.5 rounded-full bg-rosewood-600" /> API offline
      </span>
    );
  if (!health) return null;
  const demo = health.ai_mode === "demo";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-paper px-2 py-1 text-xs font-medium text-ink-soft" title={health.ai_mode_description}>
      <span className={cx("h-1.5 w-1.5 rounded-full", demo ? "bg-ochre-600" : "bg-sage-600")} />
      {demo ? "Local demo mode" : "Claude-assisted"}
    </span>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { setUserId } = useSession();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  const signOut = () => {
    setUserId(null);
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 xl:gap-6">
          <Wordmark to="/dashboard" />
          <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cx(
                    "relative whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors xl:px-3",
                    isActive ? "bg-plum-100 font-medium text-plum-900" : "text-ink-soft hover:bg-paper hover:text-ink",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-1.5 lg:flex xl:gap-3">
            <NavLink to="/profile" className={({ isActive }) => cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-sm", isActive ? "bg-plum-100 font-medium text-plum-900" : "text-ink-soft hover:bg-paper hover:text-ink")}>
              <UserRound className="h-4 w-4" aria-hidden /> <span className="sr-only xl:not-sr-only">Profile</span>
            </NavLink>
            <ModeBadge />
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-soft hover:bg-paper hover:text-ink" title="Leave this session">
              <LogOut className="h-4 w-4" aria-hidden /> <span className="sr-only xl:not-sr-only">Exit</span>
            </button>
          </div>
          <button className="ml-auto rounded-md p-2 text-ink hover:bg-paper lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <nav className="border-t border-line bg-white px-4 pb-4 pt-2 lg:hidden" aria-label="Main">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => cx("block rounded-lg px-3 py-2.5 text-[0.95rem]", isActive ? "bg-plum-100 font-medium text-plum-900" : "text-ink-soft")}
              >
                {n.label}
              </NavLink>
            ))}
            <NavLink to="/profile" className={({ isActive }) => cx("block rounded-lg px-3 py-2.5 text-[0.95rem]", isActive ? "bg-plum-100 font-medium text-plum-900" : "text-ink-soft")}>
              Profile & resume
            </NavLink>
            <div className="mt-3 flex items-center justify-between border-t border-line px-3 pt-3">
              <ModeBadge />
              <button onClick={signOut} className="text-sm text-ink-soft">
                Exit session
              </button>
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
        <Outlet />
      </main>
    </div>
  );
}
