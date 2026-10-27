import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCourseBySlug, getLeads, saveLeads } from "@/lib/data-store";
import type { Lead } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const rawMobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
  const mobile = rawMobile.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const courseSlug = typeof body.courseSlug === "string" ? body.courseSlug.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "";

  if (fullName.length < 2 || fullName.length > 80) {
    return NextResponse.json({ error: "Enter your name (2–80 characters)." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (!courseSlug) {
    return NextResponse.json({ error: "Choose the course you are interested in." }, { status: 400 });
  }
  const course = await getCourseBySlug(courseSlug);
  if (!course) {
    return NextResponse.json({ error: "Please choose a course from the list." }, { status: 400 });
  }

  const lead: Lead = {
    id: randomUUID(),
    fullName,
    mobile,
    courseSlug: course.slug,
    courseName: course.name,
    city,
    status: "New",
    createdAt: new Date().toISOString(),
  };
  const currentLeads = await getLeads();
  await saveLeads([lead, ...currentLeads]);

  return NextResponse.json({ success: true, message: "Your enquiry has been saved. Edusaaathi will be in touch." }, { status: 201 });
}
