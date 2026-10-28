import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const backendRes = await backendFetch("/api/dashboard/stats/");
  if (backendRes.ok && backendRes.data) {
    return NextResponse.json(backendRes.data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  return NextResponse.json(
    {
      users: { total: 0, admins: 0, staff: 0, active: 0, new_last_7_days: 0 },
      website: { total_leads: 0, total_contact_messages: 0, total_courses: 0 },
    },
    { status: 200 }
  );
}
