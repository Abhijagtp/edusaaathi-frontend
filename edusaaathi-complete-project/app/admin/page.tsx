import { redirect } from "next/navigation";
import { hasAdminSession, getAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }

  const user = await getAdminUser();
  const role = String(user?.role || "").toUpperCase();
  if (role === "CONSULTANT" || role === "COUNSELOR") {
    redirect("/consultant");
  }

  redirect("/adminuser");
}
