import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";
import { getLeads, saveLeads } from "@/lib/data-store";

export const dynamic = "force-dynamic";

function mapBackendLeadToFrontend(l: any) {
  const statusMap: Record<string, string> = {
    NEW: "New",
    CONTACTED: "Contacted",
    IN_PROGRESS: "In progress",
    ENROLLED: "Converted",
    CONVERTED: "Converted",
    CLOSED: "Lost",
    LOST: "Lost",
    New: "New",
    Contacted: "Contacted",
    "In progress": "In progress",
    Converted: "Converted",
    Lost: "Lost",
  };

  return {
    id: String(l.id || Math.random().toString(36).slice(2)),
    studentName: l.full_name || l.fullName || l.studentName || "Unnamed Student",
    phone: l.mobile_number || l.mobile || l.phone || "",
    email: l.email || "",
    course: l.course_interest || l.course_name || l.courseName || l.course || "General Inquiry",
    source: (l.referral_code || (typeof l.source === "string" && l.source.toLowerCase().includes("referral"))) ? "Consultant referral" : (l.source || "Website"),
    sourcePage: l.city ? `City: ${l.city}` : (l.sourcePage || "Website Form"),
    referredByConsultantId: l.referral_code && l.assigned_consultant ? String(l.assigned_consultant) : (l.referredByConsultantId ? String(l.referredByConsultantId) : null),
    assignedConsultantId: l.assigned_consultant ? String(l.assigned_consultant) : (l.assignedConsultantId ? String(l.assignedConsultantId) : null),
    status: statusMap[l.status] || "New",
    lastContactedAt: l.updated_at || l.lastContactedAt || null,
    createdAt: l.created_at || l.createdAt || new Date().toISOString(),
    notes: Array.isArray(l.notes)
      ? l.notes
      : l.counselor_notes
      ? [
          {
            id: `note-${l.id}`,
            text: l.counselor_notes,
            createdAt: l.updated_at || new Date().toISOString(),
            author: l.consultant_name || "Counselor",
          },
        ]
      : [],
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // 1. Fetch from Django Backend
  const backendRes = await backendFetch("/api/leads/");
  if (backendRes.ok && backendRes.data?.leads) {
    const leads = backendRes.data.leads
      .map(mapBackendLeadToFrontend)
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ leads }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  // 2. Fallback to local data-store (properly normalized)
  const rawLeads = await getLeads();
  const fallbackLeads = rawLeads
    .map(mapBackendLeadToFrontend)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ leads: fallbackLeads }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const statusReverseMap: Record<string, string> = {
    New: "NEW",
    Contacted: "CONTACTED",
    "Follow-up": "IN_PROGRESS",
    Converted: "ENROLLED",
    Lost: "CLOSED",
  };

  const payload = {
    full_name: body.studentName || body.full_name || "New Student",
    mobile_number: body.phone || body.mobile_number || "",
    email: body.email || null,
    course_interest: body.course || body.course_interest || "General",
    city: body.city || "Delhi NCR",
    status: statusReverseMap[body.status] || "NEW",
    assigned_consultant: body.assignedConsultantId ? Number(body.assignedConsultantId) : null,
    counselor_notes: body.notes?.[0]?.text || "",
  };

  const backendRes = await backendFetch("/api/leads/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (backendRes.ok && backendRes.data) {
    return NextResponse.json({ lead: mapBackendLeadToFrontend(backendRes.data) }, { status: 201 });
  }

  return NextResponse.json({ error: backendRes.error || "Unable to save lead to backend" }, { status: backendRes.status || 400 });
}
