import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import type { Course } from "@/lib/types";

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const code = course.name.replace(/[^A-Z]/g, "").slice(0, 3) || course.name.slice(0, 3).toUpperCase();
  return (
    <article className={`course-card course-card--tone-${index % 4}`} data-reveal>
      <div className="course-card__topline"><span className="course-card__index">0{index + 1}</span><span className="course-card__code">{code}</span></div>
      <h3>{course.name}</h3>
      <p className="course-card__description">{course.shortDescription}</p>
      <dl className="course-card__details">
        <div><dt>Duration</dt><dd>{course.duration}</dd></div>
        <div><dt>Eligibility</dt><dd>{course.eligibility}</dd></div>
      </dl>
      <Link className="course-card__link" href={`/courses/${course.slug}`}>View course <ArrowRightIcon /></Link>
    </article>
  );
}
