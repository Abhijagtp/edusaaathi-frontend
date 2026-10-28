import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const backendRes = await backendFetch("/api/auth/me/");
  if (backendRes.ok && backendRes.data) {
    return NextResponse.json(backendRes.data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  }

  return NextResponse.json({ error: backendRes.error || "Failed to load profile" }, { status: backendRes.status || 500 });
}

export async function PATCH(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const backendRes = await backendFetch("/api/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (backendRes.ok && backendRes.data) {
    return NextResponse.json(backendRes.data);
  }

  return NextResponse.json({ error: backendRes.error || "Failed to update profile" }, { status: backendRes.status || 400 });
}
