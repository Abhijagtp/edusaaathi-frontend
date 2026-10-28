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

  const statusReverseMap: Record<string, string> = {
    New: "NEW",
    Contacted: "CONTACTED",
    "In progress": "IN_PROGRESS",
    "Follow-up": "IN_PROGRESS",
    Converted: "ENROLLED",
    Lost: "CLOSED",
    NEW: "NEW",
    CONTACTED: "CONTACTED",
    IN_PROGRESS: "IN_PROGRESS",
    ENROLLED: "ENROLLED",
    CLOSED: "CLOSED",
  };

  const payload: Record<string, any> = {};
  if (body.status) payload.status = statusReverseMap[body.status] || body.status;
  if (body.assignedConsultantId !== undefined) {
    payload.assigned_consultant = body.assignedConsultantId ? Number(body.assignedConsultantId) : null;
  }
  if (body.counselor_notes !== undefined) {
    payload.counselor_notes = body.counselor_notes;
  }
  if (body.note) {
    payload.counselor_notes = body.note;
  }

  const backendRes = await backendFetch(`/api/leads/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (backendRes.ok) {
    return NextResponse.json({ success: true, lead: backendRes.data });
  }

  return NextResponse.json({ error: backendRes.error || "Update failed" }, { status: backendRes.status });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;
  const backendRes = await backendFetch(`/api/leads/${id}/`, {
    method: "DELETE",
  });

  if (backendRes.ok || backendRes.status === 204) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: backendRes.error || "Delete failed" }, { status: backendRes.status });
}
