import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

function mapToConsultantLead(l: any) {
  const statusMap: Record<string, string> = {
    NEW: "New",
    CONTACTED: "Contacted",
    IN_PROGRESS: "In progress",
    ENROLLED: "Converted",
    CLOSED: "Lost",
  };

  return {
    id: String(l.id),
    fullName: l.full_name || "Prospective Student",
    phone: l.mobile_number || "",
    email: l.email || "",
    interestedCourse: l.course_interest || l.course_name || "General Course",
    source: l.referral_code ? "Consultant referral" : "Website",
    referralCode: l.referral_code || null,
    referredByConsultantId: l.assigned_consultant ? String(l.assigned_consultant) : null,
    referredByConsultantName: l.consultant_name || null,
    assignedConsultantId: String(l.assigned_consultant || ""),
    status: statusMap[l.status] || "New",
    createdAt: l.created_at || new Date().toISOString(),
    lastContactedAt: l.updated_at || null,
    convertedAt: l.status === "ENROLLED" ? l.updated_at : null,
    updatedAt: l.updated_at || new Date().toISOString(),
    city: l.city || "",
    educationalBackground: l.other_course || "",
    notes: l.counselor_notes
      ? [
          {
            id: `note-${l.id}`,
            text: l.counselor_notes,
            createdAt: l.updated_at || new Date().toISOString(),
            author: l.consultant_name || "Consultant",
          },
        ]
      : [],
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const backendRes = await backendFetch("/api/consultant/leads/");
  if (backendRes.ok && Array.isArray(backendRes.data)) {
    const leads = backendRes.data.map(mapToConsultantLead);
    return NextResponse.json({ leads }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  return NextResponse.json({ leads: [] }, { status: 200 });
}
