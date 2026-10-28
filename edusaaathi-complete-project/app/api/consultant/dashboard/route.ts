import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const backendRes = await backendFetch("/api/consultant/dashboard/");
  if (backendRes.ok && backendRes.data) {
    return NextResponse.json(backendRes.data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  return NextResponse.json(
    { error: backendRes.error || "Unable to load consultant dashboard." },
    { status: backendRes.status || 500 }
  );
}
