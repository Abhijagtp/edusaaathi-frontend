import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/auth";
import { ConsultantPortalProvider } from "@/components/consultant/consultant-provider";
import { ConsultantShell } from "@/components/consultant/consultant-shell";

export const metadata: Metadata = {
  title: { default: "Consultant Workspace", template: "%s | Edusaaathi Consultant" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConsultantLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
  return <ConsultantPortalProvider><ConsultantShell>{children}</ConsultantShell></ConsultantPortalProvider>;
}
