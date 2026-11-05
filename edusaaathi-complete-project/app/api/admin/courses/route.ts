import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";
import { getCourses, saveCourses } from "@/lib/data-store";
import { slugify } from "@/lib/format";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function imageValue(value: unknown): string | null {
  const raw = text(value, 500);
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function mapBackendCourse(c: any): Course {
  return {
    id: String(c.id),
    slug: c.slug,
    name: c.name || c.slug,
    shortDescription: c.short_description || "",
    description: c.description || "",
    duration: c.duration || "Typically 3 years",
    eligibility: c.eligibility || "10+2 from a recognised board",
    fees: c.fees || null,
    highlights: Array.isArray(c.highlights) ? c.highlights : [],
    admissionInfo: c.admission_info || "Consult official admissions prospectus",
    image: c.image || null,
    imageAlt: c.image_alt || null,
    published: c.published !== false,
    updatedAt: c.updated_at || new Date().toISOString(),
  };
}

export async function GET() {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  // 1. Attempt to fetch from Django backend admin endpoint
  const backendRes = await backendFetch("/api/admin/courses/");
  if (backendRes.ok && (backendRes.data?.courses || backendRes.data?.results)) {
    const rawList = backendRes.data.courses || backendRes.data.results;
    const courses = rawList.map(mapBackendCourse);
    return NextResponse.json({ courses }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }

  // 2. Fallback to data store (which queries live backend with include_all=true or courses.json)
  const courses = await getCourses(true);
  return NextResponse.json({ courses }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid course details." }, { status: 400 });
  }

  const name = text(body.name, 80);
  const slug = slugify(text(body.slug, 100) || name);
  const shortDescription = text(body.shortDescription, 240);
  const description = text(body.description, 4000);
  const duration = text(body.duration, 100);
  const eligibility = text(body.eligibility, 1000);
  const feesInput = text(body.fees, 120);
  const admissionInfo = text(body.admissionInfo, 3000);
  const highlights = Array.isArray(body.highlights)
    ? body.highlights.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 250)).filter(Boolean).slice(0, 12)
    : [];
  const image = imageValue(body.image);
  const imageAlt = text(body.imageAlt, 160) || null;

  if (!name || !slug) {
    return NextResponse.json({ error: "Complete the required course fields before saving." }, { status: 400 });
  }

  // Save to Django PostgreSQL backend
  const backendPayload = {
    name,
    slug,
    short_description: shortDescription,
    description,
    duration,
    eligibility,
    fees: feesInput || "",
    highlights,
    admission_info: admissionInfo,
    image: image || "",
    image_alt: imageAlt || "",
    published: Boolean(body.published),
  };

  let assignedId: string = randomUUID();

  // Try /api/admin/courses/ first, fallback to /api/courses/
  let backendRes = await backendFetch("/api/admin/courses/", {
    method: "POST",
    body: JSON.stringify(backendPayload),
  }).catch(() => null);

  if (!backendRes || !backendRes.ok) {
    backendRes = await backendFetch("/api/courses/", {
      method: "POST",
      body: JSON.stringify(backendPayload),
    }).catch(() => null);
  }

  if (backendRes?.ok && (backendRes.data?.course?.id || backendRes.data?.id)) {
    assignedId = String(backendRes.data.course?.id || backendRes.data.id);
  }

  const courses = await getCourses(true);
  const course: Course = {
    id: assignedId,
    slug,
    name,
    shortDescription,
    description,
    duration,
    eligibility,
    fees: feesInput || null,
    highlights,
    admissionInfo,
    image,
    imageAlt,
    published: Boolean(body.published),
    updatedAt: new Date().toISOString(),
  };
  await saveCourses([...courses.filter((c) => c.slug !== slug && c.id !== assignedId), course]);

  // Purge Next.js full-route cache so public site and admin list show the course immediately
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/adminuser/courses");

  return NextResponse.json({ course }, { status: 201 });
}
