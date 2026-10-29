import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/auth";
import { backendFetch } from "@/lib/backend-client";
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
  const index = courses.findIndex((course) => course.id === id || course.slug === id);
  const existing = index >= 0 ? courses[index] : null;

  // 1. Build backend payload for Django REST Framework
  const backendPayload: Record<string, unknown> = {};

  if (typeof body.published === "boolean") {
    backendPayload.published = body.published;
    backendPayload.is_active = body.published;
  }
  if (body.name !== undefined) backendPayload.name = text(body.name, existing?.name || "", 120);
  if (body.slug !== undefined) backendPayload.slug = slugify(text(body.slug, existing?.slug || "", 120));
  if (body.shortDescription !== undefined) backendPayload.short_description = text(body.shortDescription, existing?.shortDescription || "", 300);
  if (body.description !== undefined) backendPayload.description = text(body.description, existing?.description || "", 4000);
  if (body.duration !== undefined) backendPayload.duration = text(body.duration, existing?.duration || "Typically 3 years", 120);
  if (body.eligibility !== undefined) backendPayload.eligibility = text(body.eligibility, existing?.eligibility || "", 1000);
  if (body.admissionInfo !== undefined) backendPayload.admission_info = text(body.admissionInfo, existing?.admissionInfo || "", 3000);
  if (body.fees !== undefined) backendPayload.fees = text(body.fees, "", 120);
  if (body.highlights !== undefined && Array.isArray(body.highlights)) {
    backendPayload.highlights = body.highlights
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().slice(0, 250))
      .filter(Boolean)
      .slice(0, 12);
  }
  if (body.image !== undefined) backendPayload.image = imageValue(body.image, existing?.image || null) || "";
  if (body.imageAlt !== undefined) backendPayload.image_alt = text(body.imageAlt, "", 160);

  // 2. Forward to Django backend (supports ID and slug lookup)
  let backendOk = false;
  let backendData: any = null;

  const resById = await backendFetch(`/api/admin/courses/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(backendPayload),
  });

  if (resById.ok) {
    backendOk = true;
    backendData = resById.data;
  } else if (existing?.slug && existing.slug !== id) {
    const resBySlug = await backendFetch(`/api/admin/courses/${existing.slug}/`, {
      method: "PATCH",
      body: JSON.stringify(backendPayload),
    });
    if (resBySlug.ok) {
      backendOk = true;
      backendData = resBySlug.data;
    }
  }

  // 3. Update local store cache for offline resilience
  let updatedCourse: Course;
  if (existing) {
    updatedCourse = {
      ...existing,
      name: body.name !== undefined ? text(body.name, existing.name, 120) : existing.name,
      slug: body.slug !== undefined ? slugify(text(body.slug, existing.slug, 120)) : existing.slug,
      shortDescription: body.shortDescription !== undefined ? text(body.shortDescription, existing.shortDescription, 300) : existing.shortDescription,
      description: body.description !== undefined ? text(body.description, existing.description, 4000) : existing.description,
      duration: body.duration !== undefined ? text(body.duration, existing.duration, 120) : existing.duration,
      eligibility: body.eligibility !== undefined ? text(body.eligibility, existing.eligibility, 1000) : existing.eligibility,
      fees: body.fees !== undefined ? text(body.fees, "", 120) || null : existing.fees,
      highlights: body.highlights !== undefined && Array.isArray(body.highlights)
        ? body.highlights.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
        : existing.highlights,
      admissionInfo: body.admissionInfo !== undefined ? text(body.admissionInfo, existing.admissionInfo, 3000) : existing.admissionInfo,
      image: body.image !== undefined ? imageValue(body.image, existing.image) : existing.image,
      imageAlt: body.imageAlt !== undefined ? text(body.imageAlt, "", 160) || null : existing.imageAlt,
      published: typeof body.published === "boolean" ? body.published : existing.published,
      updatedAt: new Date().toISOString(),
    };
    courses[index] = updatedCourse;
    await saveCourses(courses);
  } else if (backendData) {
    updatedCourse = {
      id: String(backendData.id),
      slug: backendData.slug,
      name: backendData.name,
      shortDescription: backendData.short_description || "",
      description: backendData.description || "",
      duration: backendData.duration || "Typically 3 years",
      eligibility: backendData.eligibility || "",
      fees: backendData.fees || null,
      highlights: backendData.highlights || [],
      admissionInfo: backendData.admission_info || "",
      image: backendData.image || null,
      imageAlt: backendData.image_alt || null,
      published: backendData.published !== false,
      updatedAt: backendData.updated_at || new Date().toISOString(),
    };
  } else {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  // Purge Next.js full-route cache so the public site reflects the update immediately
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${updatedCourse.slug}`);

  return NextResponse.json({ course: updatedCourse, liveSynced: backendOk });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasAdminSession())) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const courses = await getCourses(true);
  const existing = courses.find((course) => course.id === id || course.slug === id);

  // 1. Forward delete to Django backend
  await backendFetch(`/api/admin/courses/${id}/`, { method: "DELETE" }).catch(() => null);
  if (existing?.slug && existing.slug !== id) {
    await backendFetch(`/api/admin/courses/${existing.slug}/`, { method: "DELETE" }).catch(() => null);
  }

  // 2. Remove from local store cache
  await saveCourses(courses.filter((course) => course.id !== id && course.slug !== id));

  // Purge Next.js full-route cache so the deleted course disappears from the public site
  revalidatePath("/");
  revalidatePath("/courses");
  if (existing?.slug) revalidatePath(`/courses/${existing.slug}`);

  return NextResponse.json({ success: true });
}
