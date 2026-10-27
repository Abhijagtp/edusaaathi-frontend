import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
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

export async function GET() {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
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

  if (!name || !slug || !shortDescription || !description || !duration || !eligibility || !admissionInfo) {
    return NextResponse.json({ error: "Complete the required course fields before saving." }, { status: 400 });
  }
  if (body.image && !image) return NextResponse.json({ error: "Use a valid http(s) image URL or a site-relative path." }, { status: 400 });
  const courses = await getCourses(true);
  if (courses.some((course) => course.slug === slug)) {
    return NextResponse.json({ error: "A course with this URL slug already exists." }, { status: 409 });
  }

  const course: Course = {
    id: randomUUID(),
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
  await saveCourses([...courses, course]);
  return NextResponse.json({ course }, { status: 201 });
}
