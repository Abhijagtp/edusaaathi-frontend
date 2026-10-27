import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { getLeads, saveLeads } from "@/lib/data-store";
import { LEAD_STATUSES } from "@/lib/types";
import type { LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  let body: { status?: unknown };
  try {
    body = (await request.json()) as { status?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid lead update." }, { status: 400 });
  }
  if (typeof body.status !== "string" || !LEAD_STATUSES.includes(body.status as LeadStatus)) {
    return NextResponse.json({ error: "Choose a valid lead status." }, { status: 400 });
  }
  const leads = await getLeads();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index < 0) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
  leads[index] = { ...leads[index], status: body.status as LeadStatus };
  await saveLeads(leads);
  return NextResponse.json({ lead: leads[index] });
}
