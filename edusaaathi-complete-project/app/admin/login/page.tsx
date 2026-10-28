import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { hasAdminSession, getAdminUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");

  return (
    <main className="admin-login-page" id="main-content">
      <div className="admin-login-aside">
        <BrandMark light />
        <div className="admin-login-aside__copy">
          <p className="eyebrow eyebrow--light">
            <span className="eyebrow__dot" /> PRIVATE PORTAL
          </p>
          <h1>
            Keep the next<br />
            <em>step in view.</em>
          </h1>
          <p>
            Manage student course pathways, track live enquiries, and grow your consultant network from one unified workspace.
          </p>
        </div>
        <Link href="/" className="admin-back-link">
          ← Back to Edusaaathi
        </Link>
        <span className="admin-login-aside__foot">EDUSAAATHI · PORTAL</span>
      </div>
      <div className="admin-login-main">
        <div className="admin-login-card">
          <p className="eyebrow">
            <span className="eyebrow__dot" /> SECURE SIGN IN
          </p>
          <h2>
            Welcome <em>back.</em>
          </h2>
          <p>Enter your credentials to access your administrative dashboard or consultant workspace.</p>
          <AdminLoginForm />
        </div>
        <p className="admin-login-main__foot">Authorised administrators and registered consultants only.</p>
      </div>
    </main>
  );
}
