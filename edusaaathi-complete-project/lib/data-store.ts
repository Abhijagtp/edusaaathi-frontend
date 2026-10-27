import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Course, Lead } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const coursesPath = path.join(dataDirectory, "courses.json");
const leadsPath = path.join(dataDirectory, "enquiries.json");
const featuredCourseOrder = ["bca", "bba", "mba", "b-tech", "mca", "b-com"];
let writeChain: Promise<unknown> = Promise.resolve();

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
  const courses = await getCourses(includeUnpublished);
  return courses.find((course) => course.slug === slug) ?? null;
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
