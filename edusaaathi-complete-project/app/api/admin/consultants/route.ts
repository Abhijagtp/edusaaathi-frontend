import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";

export const dynamic = "force-dynamic";

function mapBackendConsultant(c: any) {
  return {
    id: String(c.id),
    userId: String(c.user_id || c.id),
    name: c.full_name || `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
    email: c.email || "",
    phone: c.phone_number || "",
    agencyName: c.agency_name || "",
    city: c.city || "",
    referralCode: c.referral_code || "",
    referralLink: c.referral_link || `http://localhost:3000/?ref=${c.referral_code}`,
    status: c.is_active ? "Active" : "Inactive",
    referralClicks: c.total_leads || 0,
    totalLeads: c.total_leads || 0,
    newLeads: c.new_leads || 0,
    enrolledLeads: c.enrolled_leads || 0,
    createdAt: c.created_at || new Date().toISOString(),
  };
}

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const backendRes = await backendFetch("/api/consultants/");
  if (backendRes.ok && Array.isArray(backendRes.data)) {
    const consultants = backendRes.data.map(mapBackendConsultant);
    return NextResponse.json({ consultants }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  return NextResponse.json({ consultants: [] }, { status: 200 });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const fullName = (body.name || "").trim();
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0] || "Consultant";
  const lastName = nameParts.slice(1).join(" ") || "";
  const email = (body.email || "").trim().toLowerCase();
  const phone = (body.phone || "").trim();
  const password = (body.password || "").trim();
  const referralCode = body.referralCode ? body.referralCode.trim().toUpperCase() : undefined;

  const payload: Record<string, unknown> = {
    full_name: fullName || `${firstName} ${lastName}`.trim() || "Consultant",
    first_name: firstName,
    last_name: lastName,
    email,
    phone_number: phone,
    agency_name: body.agencyName || "Education Consultancy",
    city: body.city || "Mumbai",
  };

  if (password) {
    payload.password = password;
  }
  if (referralCode) {
    payload.referral_code = referralCode;
  }

  const backendRes = await backendFetch("/api/consultants/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (backendRes.ok && backendRes.data?.consultant) {
    const rawConsultant = backendRes.data.consultant;
    const initialPassword = backendRes.data.initial_password || rawConsultant?.initial_password || password || null;
    return NextResponse.json({
      success: true,
      consultant: mapBackendConsultant(rawConsultant),
      message: backendRes.data.message || "Consultant account provisioned successfully",
      initialPassword,
    }, { status: 201 });
  }

  return NextResponse.json({ error: backendRes.error || "Failed to create consultant" }, { status: backendRes.status || 400 });
}
