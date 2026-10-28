import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCourses } from "@/lib/data-store";
import { hasAdminSession, getAdminUser } from "@/lib/auth";
import { AdminSessionProvider, type DemoSession } from "@/components/adminuser/admin-session-provider";
import { AdminDataProvider } from "@/components/adminuser/admin-data-provider";
import { AdminShell } from "@/components/adminuser/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin Workspace", template: "%s | Edusaaathi Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  const user = await getAdminUser();
  const role = String(user?.role || "").toUpperCase();
  if (role === "CONSULTANT" || role === "COUNSELOR") {
    redirect("/consultant");
  }

  const publicCourses = await getCourses(true);
  const initialSession: DemoSession = { role: "admin", consultantId: null };

  return (
    <AdminSessionProvider initialSession={initialSession}>
      <AdminDataProvider initialCourses={publicCourses}>
        <AdminShell>{children}</AdminShell>
      </AdminDataProvider>
    </AdminSessionProvider>
  );
}
