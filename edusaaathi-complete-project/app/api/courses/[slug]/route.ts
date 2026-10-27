import { NextResponse } from "next/server";
import { getCourseBySlug } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  return NextResponse.json(
    { course },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
