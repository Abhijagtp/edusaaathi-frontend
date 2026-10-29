import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCourseBySlug, getLeads, saveLeads } from "@/lib/data-store";
import { getBackendUrl } from "@/lib/auth";
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
  const refCode = typeof body.ref === "string" && body.ref.trim()
    ? body.ref.trim().toUpperCase()
    : (typeof body.referral_code === "string" && body.referral_code.trim()
      ? body.referral_code.trim().toUpperCase()
      : (typeof body.referralCode === "string" && body.referralCode.trim()
        ? body.referralCode.trim().toUpperCase()
        : undefined));

  if (fullName.length < 2 || fullName.length > 80) {
    return NextResponse.json({ error: "Enter your name (2–80 characters)." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ error: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
  }
  if (!courseSlug && !body.otherCourse) {
    return NextResponse.json({ error: "Choose the course you are interested in." }, { status: 400 });
  }
  let course = courseSlug ? await getCourseBySlug(courseSlug) : null;
  if (!course && courseSlug && courseSlug !== "other") {
    const { getCourses } = await import("@/lib/data-store");
    const allCourses = await getCourses();
    course = allCourses.find((c) => c.slug.toLowerCase().startsWith(courseSlug.toLowerCase()) || c.slug.toLowerCase().includes(courseSlug.toLowerCase()) || c.name.toLowerCase().includes(courseSlug.toLowerCase())) || null;
  }
  const courseName = course ? course.name : (typeof body.otherCourse === "string" && body.otherCourse.trim() ? `Other: ${body.otherCourse.trim()}` : "General Enquiry");
  const finalSlug = course ? course.slug : (courseSlug || "other");

  // 1. Forward directly to Django REST Framework + PostgreSQL backend
  try {
    const backendUrl = getBackendUrl();
    await fetch(`${backendUrl}/api/enquiries/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        mobile,
        course_interest: courseName,
        courseSlug: finalSlug,
        other_course: body.otherCourse || undefined,
        city: city || "Delhi NCR",
        referral_code: refCode,
        ref: refCode,
      }),
      cache: "no-store",
    });
  } catch {
    // Non-blocking fallback to local store
  }

  // 2. Save in local data-store for instant fallback
  const lead: Lead = {
    id: randomUUID(),
    fullName,
    mobile,
    courseSlug: finalSlug,
    courseName,
    city,
    referralCode: refCode,
    status: "New",
    createdAt: new Date().toISOString(),
  };
  const currentLeads = await getLeads();
  await saveLeads([lead, ...currentLeads]);

  return NextResponse.json({ success: true, message: "Your enquiry has been saved. Edusaaathi will be in touch." }, { status: 201 });
}
