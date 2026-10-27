import type { Metadata } from "next";
import { DemoLoginPage } from "@/components/adminuser/demo-login-page";

export const metadata: Metadata = {
  title: "Demo sign in",
  robots: { index: false, follow: false },
};

export default function AdminUserDemoLoginRoute() {
  return <DemoLoginPage />;
}
