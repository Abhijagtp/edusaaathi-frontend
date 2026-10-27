import { NextResponse } from "next/server";
import { getCourses } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const courses = await getCourses();
  return NextResponse.json(
    { courses },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
