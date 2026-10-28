"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
const ADMIN_DEMO_SESSION_KEY = "coursesathi-adminuser-demo-session-v1";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: { id?: number; full_name?: string; email?: string; role?: string };
      };

      if (!response.ok) {
        throw new Error(data.error || "Invalid email or password.");
      }

      const role = String(data.user?.role || "").toUpperCase();
      const isConsultant = role === "CONSULTANT" || role === "COUNSELOR";

      try {
        if (isConsultant) {
          window.sessionStorage.setItem(
            ADMIN_DEMO_SESSION_KEY,
            JSON.stringify({
              role: "consultant",
              consultantId: String((data.user as any)?.consultant_id || data.user?.id || "1"),
            })
          );
        } else {
          window.sessionStorage.setItem(
            ADMIN_DEMO_SESSION_KEY,
            JSON.stringify({
              role: "admin",
              consultantId: null,
            })
          );
        }
      } catch {
        // Storage optional
      }

      const targetPath = isConsultant ? "/consultant" : "/adminuser";
      window.location.href = targetPath;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-email">Email Address</label>
      <input
        id="admin-email"
        name="email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@edusaathi.com"
        required
        autoFocus
      />

      <label htmlFor="admin-password">Password</label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••••••"
        required
      />

      {error ? (
        <p className="admin-login-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="button button--primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
        <span aria-hidden="true">→</span>
      </button>

      <p className="admin-login-hint">
        Sign in with your administrator or consultant account credentials.
      </p>
    </form>
  );
}
