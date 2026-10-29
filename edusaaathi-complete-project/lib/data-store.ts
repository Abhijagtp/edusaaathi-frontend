import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";
import type { Course, Lead } from "@/lib/types";
import { getBackendUrl } from "@/lib/auth";

const dataDirectory = path.join(process.cwd(), "data");
const coursesPath = path.join(dataDirectory, "courses.json");
const leadsPath = path.join(dataDirectory, "enquiries.json");
const featuredCourseOrder = [
  "bca",
  "bca-bachelor-of-computer-applications",
  "bba",
  "bba-bachelor-of-business-administration",
  "mba",
  "mba-master-of-business-administration",
  "b-tech",
  "btech-computer-science-engineering",
  "btech-artificial-intelligence-data-science",
  "mca",
  "mca-master-of-computer-applications",
  "b-com",
  "bcom",
  "bsc-nursing-healthcare",
  "mbbs-medicine-surgery",
  "digital-marketing-analytics-certification",
  "full-stack-web-software-development",
];
let writeChain: Promise<unknown> = Promise.resolve();

function mapBackendCourse(c: any): Course {
  return {
    id: String(c.id),
    slug: c.slug,
    name: c.name || c.title || c.slug,
    shortDescription: c.short_description || c.shortDescription || c.description || "",
    description: c.description || c.short_description || c.shortDescription || "",
    duration: c.duration || "Typically 3 years",
    eligibility: c.eligibility || "10+2 from a recognised board (varies by institution)",
    fees: c.fees || null,
    highlights: Array.isArray(c.highlights) && c.highlights.length > 0 ? c.highlights : ["Comprehensive curriculum", "Industry recognized", "Career guidance"],
    admissionInfo: c.admission_info || c.admissionInfo || "Consult official admissions prospectus",
    image: c.image || null,
    imageAlt: c.image_alt || c.imageAlt || null,
    published: c.published !== false && c.is_active !== false,
    updatedAt: c.updated_at || c.updatedAt || new Date().toISOString(),
  };
}

async function fetchBackendCourses(): Promise<Course[] | null> {
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/courses/?_t=${Date.now()}`, {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rawList = Array.isArray(json) ? json : json.courses || json.results;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map(mapBackendCourse);
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchBackendCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/courses/${slug}/?_t=${Date.now()}`, {
      cache: "no-store",
      next: { revalidate: 0 },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && (json.slug || json.name || json.id)) {
      return mapBackendCourse(json);
    }
    return null;
  } catch {
    return null;
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, value: T): Promise<void> {
  const task = writeChain.then(async () => {
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await rename(temporaryPath, filePath);
  });
  writeChain = task.catch(() => undefined);
  await task;
}

export async function getCourses(includeUnpublished = false): Promise<Course[]> {
  // Opt out of Next.js Data Cache — every call reads fresh data
  noStore();

  // 1. Fetch live courses from Django PostgreSQL backend
  const liveCourses = await fetchBackendCourses();
  if (liveCourses && liveCourses.length > 0) {
    return liveCourses
      .filter((course) => includeUnpublished || course.published)
      .sort((a, b) => {
        const aRank = featuredCourseOrder.indexOf(a.slug);
        const bRank = featuredCourseOrder.indexOf(b.slug);
        const normalizedA = aRank < 0 ? featuredCourseOrder.length : aRank;
        const normalizedB = bRank < 0 ? featuredCourseOrder.length : bRank;
        return normalizedA === normalizedB ? a.name.localeCompare(b.name) : normalizedA - normalizedB;
      });
  }

  // 2. Fallback to local data/courses.json if backend is offline
  const courses = await readJson<Course[]>(coursesPath, []);
  return courses
    .filter((course) => includeUnpublished || course.published)
    .sort((a, b) => {
      const aRank = featuredCourseOrder.indexOf(a.slug);
      const bRank = featuredCourseOrder.indexOf(b.slug);
      const normalizedA = aRank < 0 ? featuredCourseOrder.length : aRank;
      const normalizedB = bRank < 0 ? featuredCourseOrder.length : bRank;
      return normalizedA === normalizedB ? a.name.localeCompare(b.name) : normalizedA - normalizedB;
    });
}

export async function getCourseBySlug(slug: string, includeUnpublished = false): Promise<Course | null> {
  // Opt out of Next.js Data Cache — every call reads fresh data
  noStore();

  // 1. Fetch direct from backend
  const liveCourse = await fetchBackendCourseBySlug(slug);
  if (liveCourse && (includeUnpublished || liveCourse.published)) {
    return liveCourse;
  }

  // 2. Fallback to list search
  const courses = await getCourses(includeUnpublished);
  return courses.find((course) => course.slug.toLowerCase() === slug.toLowerCase() || course.id === slug) ?? null;
}

export async function saveCourses(courses: Course[]): Promise<void> {
  await writeJson(coursesPath, courses);
}

export async function getLeads(): Promise<Lead[]> {
  return readJson<Lead[]>(leadsPath, []);
}

export async function saveLeads(leads: Lead[]): Promise<void> {
  await writeJson(leadsPath, leads);
}
