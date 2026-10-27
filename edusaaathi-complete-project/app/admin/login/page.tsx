import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { hasAdminSession } from "@/lib/auth";

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
        <div className="admin-login-aside__copy"><p className="eyebrow eyebrow--light"><span className="eyebrow__dot" /> PRIVATE WORKSPACE</p><h1>Keep the next<br /><em>step in view.</em></h1><p>Manage course guides and review incoming enquiries from one simple workspace.</p></div>
        <Link href="/" className="admin-back-link">← Back to Edusaaathi</Link>
        <span className="admin-login-aside__foot">EDUSAAATHI · ADMIN</span>
      </div>
      <div className="admin-login-main">
        <div className="admin-login-card">
          <p className="eyebrow"><span className="eyebrow__dot" /> ADMIN ACCESS</p>
          <h2>Welcome <em>back.</em></h2>
          <p>Sign in to manage course information and enquiries.</p>
          <AdminLoginForm />
        </div>
        <p className="admin-login-main__foot">Authorised Edusaaathi administrators only.</p>
      </div>
    </main>
  );
}
