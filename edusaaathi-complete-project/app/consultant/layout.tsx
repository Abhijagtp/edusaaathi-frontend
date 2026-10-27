import type { Metadata } from "next";
import { ConsultantPortalProvider } from "@/components/consultant/consultant-provider";
import { ConsultantShell } from "@/components/consultant/consultant-shell";

export const metadata: Metadata = {
  title: { default: "Consultant Workspace", template: "%s | Edusaaathi Consultant" },
  robots: { index: false, follow: false },
};

export default function ConsultantLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ConsultantPortalProvider><ConsultantShell>{children}</ConsultantShell></ConsultantPortalProvider>;
}
