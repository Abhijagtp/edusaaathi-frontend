import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { getLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const leads = (await getLeads()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ leads }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
