"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: String(form.get("password") || "") }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-password">Admin password</label>
      <input id="admin-password" name="password" type="password" autoComplete="current-password" required autoFocus />
      {error ? <p className="admin-login-error" role="alert">{error}</p> : null}
      <button className="button button--primary" type="submit" disabled={loading}>{loading ? "Checking…" : "Sign in"}<span aria-hidden="true">→</span></button>
      {process.env.NODE_ENV !== "production" ? <p className="admin-login-hint">Local preview password: <code>coursesathi-demo</code></p> : null}
    </form>
  );
}
