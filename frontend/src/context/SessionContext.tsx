import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/api/client";
import type { Health } from "@/api/types";

const STORAGE_KEY = "restarther.userId";

function readStoredId(): number | null {
  try {
    const authRaw = window.localStorage.getItem("restarther_user");
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      if (parsed?.id && Number.isInteger(Number(parsed.id))) {
        return Number(parsed.id);
      }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

interface SessionValue {
  /** The active ReStartHer user id. The backend has no login yet: the id is the session. */
  userId: number | null;
  setUserId: (id: number | null) => void;
  health: Health | null;
  /** null while checking, false if the API can't be reached. */
  apiOnline: boolean | null;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(readStoredId);
  const [health, setHealth] = useState<Health | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const setUserId = useCallback((id: number | null) => {
    setUserIdState(id);
    try {
      if (id === null) window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* storage unavailable: session lasts for this tab only */
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .health(ctrl.signal)
      .then((h) => {
        setHealth(h);
        setApiOnline(true);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setApiOnline(false);
      });
    return () => ctrl.abort();
  }, []);

  const value = useMemo(() => ({ userId, setUserId, health, apiOnline }), [userId, setUserId, health, apiOnline]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
