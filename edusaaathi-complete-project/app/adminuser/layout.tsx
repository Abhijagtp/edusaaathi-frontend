import type { Metadata } from "next";
import { getCourses } from "@/lib/data-store";
import { AdminSessionProvider } from "@/components/adminuser/admin-session-provider";
import { AdminDataProvider } from "@/components/adminuser/admin-data-provider";
import { AdminShell } from "@/components/adminuser/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin Workspace", template: "%s | Edusaaathi Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminUserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publicCourses = await getCourses(true);
  return <AdminSessionProvider><AdminDataProvider initialCourses={publicCourses}><AdminShell>{children}</AdminShell></AdminDataProvider></AdminSessionProvider>;
}
