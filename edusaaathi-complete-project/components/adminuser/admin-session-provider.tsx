"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const ADMIN_DEMO_SESSION_KEY = "coursesathi-adminuser-demo-session-v1";
export type DemoSession =
  | { role: "admin"; consultantId: null; name?: string; email?: string }
  | { role: "consultant"; consultantId: string; name?: string; email?: string };

type SessionValue = {
  session: DemoSession | null;
  sessionHydrated: boolean;
  loginAsAdmin: () => void;
  loginAsConsultant: (consultantId: string) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AdminSessionProvider({
  children,
  initialSession = null,
}: {
  children: React.ReactNode;
  initialSession?: DemoSession | null;
}) {
  const [session, setSession] = useState<DemoSession | null>(initialSession);
  const [sessionHydrated, setSessionHydrated] = useState(Boolean(initialSession));

  useEffect(() => {
    let resolvedSession: DemoSession | null = initialSession;

    try {
      // 1. Check sessionStorage
      const saved = window.sessionStorage.getItem(ADMIN_DEMO_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DemoSession>;
        if (parsed.role === "admin") {
          resolvedSession = {
            role: "admin",
            consultantId: null,
            name: parsed.name || "Administrator",
            email: parsed.email || "admin@edusaathi.com",
          };
        } else if (parsed.role === "consultant" && parsed.consultantId) {
          resolvedSession = {
            role: "consultant",
            consultantId: String(parsed.consultantId),
            name: parsed.name,
            email: parsed.email,
          };
        }
      }

      // 2. If not in sessionStorage, check server cookies set by /api/admin/login
      if (!resolvedSession) {
        const userCookieRaw = getCookie("edusaathi_admin_user");
        const adminCookie = getCookie("coursesathi_admin");
        const jwtCookie = getCookie("edusaathi_jwt_token");

        if (userCookieRaw) {
          try {
            const userObj = JSON.parse(userCookieRaw);
            const userName =
              userObj.full_name ||
              (userObj.first_name ? `${userObj.first_name} ${userObj.last_name || ""}`.trim() : null) ||
              (userObj.email ? userObj.email.split("@")[0] : null) ||
              "Administrator";
            const userEmail = userObj.email || "admin@edusaathi.com";

            if (userObj.role === "CONSULTANT" || userObj.role === "COUNSELOR") {
              resolvedSession = {
                role: "consultant",
                consultantId: String(userObj.id || "1"),
                name: userName,
                email: userEmail,
              };
            } else {
              resolvedSession = {
                role: "admin",
                consultantId: null,
                name: userName,
                email: userEmail,
              };
            }
          } catch {
            resolvedSession = { role: "admin", consultantId: null, name: "Administrator" };
          }
        } else if (adminCookie || jwtCookie) {
          resolvedSession = { role: "admin", consultantId: null, name: "Administrator" };
        }
      }
    } catch {
      resolvedSession = null;
    }

    if (resolvedSession) {
      setSession(resolvedSession);
      try {
        window.sessionStorage.setItem(ADMIN_DEMO_SESSION_KEY, JSON.stringify(resolvedSession));
      } catch {
        // Storage optional
      }
    }

    setSessionHydrated(true);
  }, [initialSession]);

  const loginAsAdmin = useCallback(() => {
    const next: DemoSession = { role: "admin", consultantId: null, name: "Administrator" };
    setSession(next);
    try {
      window.sessionStorage.setItem(ADMIN_DEMO_SESSION_KEY, JSON.stringify(next));
    } catch {
      // Storage optional
    }
  }, []);

  const loginAsConsultant = useCallback((consultantId: string) => {
    const next: DemoSession = { role: "consultant", consultantId: String(consultantId) };
    setSession(next);
    try {
      window.sessionStorage.setItem(ADMIN_DEMO_SESSION_KEY, JSON.stringify(next));
    } catch {
      // Storage optional
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try {
      window.sessionStorage.removeItem(ADMIN_DEMO_SESSION_KEY);
    } catch {
      // Storage optional
    }
    fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
  }, []);

  const value = useMemo(
    () => ({ session, sessionHydrated, loginAsAdmin, loginAsConsultant, logout }),
    [session, sessionHydrated, loginAsAdmin, loginAsConsultant, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useAdminSession must be used within AdminSessionProvider.");
  return value;
}
