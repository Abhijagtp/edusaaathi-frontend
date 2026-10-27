import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { getCourses, saveCourses } from "@/lib/data-store";
import { slugify } from "@/lib/format";
import type { Course } from "@/lib/types";

export const dynamic = "force-dynamic";

function text(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : fallback;
}

function imageValue(value: unknown, fallback: string | null): string | null {
  if (typeof value !== "string") return fallback;
  const raw = value.trim().slice(0, 500);
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid course details." }, { status: 400 });
  }

  const courses = await getCourses(true);
  const index = courses.findIndex((course) => course.id === id);
  if (index < 0) return NextResponse.json({ error: "Course not found." }, { status: 404 });
  const existing = courses[index];
  const name = text(body.name, existing.name, 80);
  const slug = slugify(text(body.slug, existing.slug, 100) || name);
  const image = imageValue(body.image, existing.image);
  if (body.image !== undefined && body.image !== null && body.image !== "" && !image) {
    return NextResponse.json({ error: "Use a valid http(s) image URL or a site-relative path." }, { status: 400 });
  }
  if (!name || !slug) return NextResponse.json({ error: "Course name and slug are required." }, { status: 400 });
  if (courses.some((course) => course.slug === slug && course.id !== id)) {
    return NextResponse.json({ error: "A course with this URL slug already exists." }, { status: 409 });
  }

  let highlights = existing.highlights;
  if (Array.isArray(body.highlights)) {
    highlights = body.highlights
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().slice(0, 250))
      .filter(Boolean)
      .slice(0, 12);
  }
  const updated: Course = {
    ...existing,
    name,
    slug,
    shortDescription: text(body.shortDescription, existing.shortDescription, 240),
    description: text(body.description, existing.description, 4000),
    duration: text(body.duration, existing.duration, 100),
    eligibility: text(body.eligibility, existing.eligibility, 1000),
    fees: body.fees === undefined ? existing.fees : text(body.fees, "", 120) || null,
    highlights,
    admissionInfo: text(body.admissionInfo, existing.admissionInfo, 3000),
    image,
    imageAlt: body.imageAlt === undefined ? existing.imageAlt : text(body.imageAlt, "", 160) || null,
    published: typeof body.published === "boolean" ? body.published : existing.published,
    updatedAt: new Date().toISOString(),
  };
  if (!updated.shortDescription || !updated.description || !updated.duration || !updated.eligibility || !updated.admissionInfo) {
    return NextResponse.json({ error: "Required course fields cannot be empty." }, { status: 400 });
  }
  courses[index] = updated;
  await saveCourses(courses);
  return NextResponse.json({ course: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const courses = await getCourses(true);
  if (!courses.some((course) => course.id === id)) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }
  await saveCourses(courses.filter((course) => course.id !== id));
  return NextResponse.json({ success: true });
}
