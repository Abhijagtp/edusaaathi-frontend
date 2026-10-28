import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const payload: Record<string, any> = {};
  if (body.status !== undefined) {
    payload.is_active = body.status === "Active" || body.status === true;
  }
  if (body.agencyName !== undefined) payload.agency_name = body.agencyName;
  if (body.city !== undefined) payload.city = body.city;

  const backendRes = await backendFetch(`/api/consultants/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (backendRes.ok) {
    return NextResponse.json({ success: true, consultant: backendRes.data });
  }

  return NextResponse.json({ error: backendRes.error || "Update failed" }, { status: backendRes.status });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action === "regenerate-link") {
    const backendRes = await backendFetch(`/api/consultants/${id}/regenerate-link/`, {
      method: "POST",
    });

    if (backendRes.ok) {
      return NextResponse.json(backendRes.data);
    }
    return NextResponse.json({ error: backendRes.error || "Regeneration failed" }, { status: backendRes.status });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
