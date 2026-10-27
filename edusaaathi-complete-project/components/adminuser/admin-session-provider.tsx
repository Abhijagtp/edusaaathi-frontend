"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const ADMIN_DEMO_SESSION_KEY = "coursesathi-adminuser-demo-session-v1";
export type DemoSession = { role: "admin"; consultantId: null } | { role: "consultant"; consultantId: string };

type SessionValue = {
  session: DemoSession | null;
  sessionHydrated: boolean;
  loginAsAdmin: () => void;
  loginAsConsultant: (consultantId: string) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [sessionHydrated, setSessionHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(ADMIN_DEMO_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DemoSession>;
        if (parsed.role === "admin") setSession({ role: "admin", consultantId: null });
        else if (parsed.role === "consultant" && typeof parsed.consultantId === "string") setSession({ role: "consultant", consultantId: parsed.consultantId });
      }
    } catch {
      setSession(null);
    }
    setSessionHydrated(true);
  }, []);

  const loginAsAdmin = useCallback(() => {
    const next: DemoSession = { role: "admin", consultantId: null };
    setSession(next);
    try { window.sessionStorage.setItem(ADMIN_DEMO_SESSION_KEY, JSON.stringify(next)); } catch { /* Demo session may stay in memory if storage is blocked. */ }
  }, []);

  const loginAsConsultant = useCallback((consultantId: string) => {
    const next: DemoSession = { role: "consultant", consultantId };
    setSession(next);
    try { window.sessionStorage.setItem(ADMIN_DEMO_SESSION_KEY, JSON.stringify(next)); } catch { /* Demo session may stay in memory if storage is blocked. */ }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try { window.sessionStorage.removeItem(ADMIN_DEMO_SESSION_KEY); } catch { /* No server session exists to revoke in demo mode. */ }
  }, []);

  const value = useMemo(() => ({ session, sessionHydrated, loginAsAdmin, loginAsConsultant, logout }), [session, sessionHydrated, loginAsAdmin, loginAsConsultant, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useAdminSession must be used within AdminSessionProvider.");
  return value;
}
