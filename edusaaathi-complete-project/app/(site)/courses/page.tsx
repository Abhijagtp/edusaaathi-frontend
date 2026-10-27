import type { Metadata } from "next";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { ArrowRightIcon } from "@/components/icons";
import { getCourses } from "@/lib/data-store";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Course Guides",
  description: "Browse course guides, compare typical duration and understand the eligibility details to confirm with each institution.",
  alternates: { canonical: "/courses" },
  openGraph: {
    title: "Explore Course Guides | Edusaaathi",
    description: "Browse course guides and understand what to check before your next education decision.",
    url: "/courses",
  },
};

export default async function CoursesPage() {
  const courses = await getCourses();
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: course.name,
      url: `${SITE_URL}/courses/${course.slug}`,
    })),
  };
  return (
    <main id="main-content" className="courses-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }} />
      <section className="page-intro page-wrap" aria-labelledby="all-courses-title">
        <div className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Courses</span></div>
        <p className="eyebrow"><span className="eyebrow__dot" /> COURSE DISCOVERY</p>
        <div className="page-intro__row">
          <h1 id="all-courses-title">A place to start<br /><em>exploring.</em></h1>
          <div className="page-intro__side"><p>Browse course guides to understand what you might study, how long it may take and which eligibility details to confirm.</p><span className="small-note">Course requirements differ between institutions.</span></div>
        </div>
        <div className="page-intro__ornament" aria-hidden="true"><span /> YOUR OPTIONS, MADE CLEARER</div>
      </section>
      <section className="course-section course-section--listing section-pad" aria-labelledby="listing-title">
        <div className="page-wrap">
          <div className="listing-topline"><h2 id="listing-title">Course guides <span>{String(courses.length).padStart(2, "0")}</span></h2><p>Take a look around, then follow what feels worth exploring.</p></div>
          {courses.length ? <div className="course-grid">{courses.map((course, index) => <CourseCard course={course} index={index} key={course.id} />)}</div> : <p className="empty-courses">Course guides are being updated. Please check back soon.</p>}
        </div>
      </section>
      <section className="course-listing-note page-wrap" data-reveal>
        <p>Eligibility, duration, fees and admission routes can change across institutions and intakes. Please confirm current details with the institution.</p>
        <Link href="/#faqs" className="text-link">Read our FAQs <ArrowRightIcon /></Link>
      </section>
    </main>
  );
}
