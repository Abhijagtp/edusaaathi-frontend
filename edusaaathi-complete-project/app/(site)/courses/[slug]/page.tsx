import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { EnquiryTrigger } from "@/components/enquiry-trigger";
import { ArrowRightIcon, ArrowUpRightIcon, CheckIcon, CompassIcon, RouteIcon } from "@/components/icons";
import { getCourseBySlug, getCourses } from "@/lib/data-store";
import { getWhatsAppHref, SITE_URL } from "@/lib/config";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course guide not found", robots: { index: false, follow: false } };
  const description = `${course.shortDescription} Explore duration, eligibility and admission information with Edusaaathi.`;
  return {
    title: `${course.name} Course Guide`,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title: `${course.name} Course Guide | Edusaaathi`, description, url: `/courses/${course.slug}` },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const courses = await getCourses();
  const relatedCourses = courses.filter((item) => item.id !== course.id).slice(0, 3);
  const whatsappHref = getWhatsAppHref(`Hi, I am interested in the ${course.name} course. Please share more details about the course and admission process.`);
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Courses", item: `${SITE_URL}/courses` },
      { "@type": "ListItem", position: 3, name: course.name, item: `${SITE_URL}/courses/${course.slug}` },
    ],
  };

  return (
    <main id="main-content" className="course-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData).replace(/</g, "\\u003c") }} />
      <section className="course-detail-hero page-wrap" aria-labelledby="course-title">
        <div className="breadcrumbs"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/courses">Courses</Link><span aria-hidden="true">/</span><span>{course.name}</span></div>
        <div className="course-detail-hero__content">
          <div className="course-detail-hero__copy">
            <p className="eyebrow"><span className="eyebrow__dot" /> COURSE GUIDE</p>
            <h1 id="course-title">Explore <em>{course.name}</em></h1>
            <p className="course-detail-hero__description">{course.shortDescription}</p>
            <div className="course-detail-hero__actions">
              <a className="button button--primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Ask about {course.name} <ArrowRightIcon /></a>
              <EnquiryTrigger className="button button--outline" courseSlug={course.slug}>Submit an enquiry <ArrowUpRightIcon /></EnquiryTrigger>
            </div>
            <p className="course-detail-hero__note">A starting point for your research. Confirm current details with each institution.</p>
          </div>
          <div className="course-detail-art" aria-hidden="true">
            {course.image ? <img className="course-detail-art__image" src={course.image} alt={course.imageAlt || `${course.name} course illustration`} /> : <>
              <span className="course-detail-art__ring course-detail-art__ring--one" />
              <span className="course-detail-art__ring course-detail-art__ring--two" />
              <span className="course-detail-art__mark">{course.name.replace(/[^A-Z]/g, "").slice(0, 3)}</span>
              <span className="course-detail-art__caption">A COURSE<br />TO EXPLORE</span>
              <span className="course-detail-art__path"><RouteIcon /></span>
            </>}
          </div>
        </div>
      </section>

      <section className="course-facts-section section-pad" aria-labelledby="course-facts-title">
        <div className="page-wrap">
          <div className="course-facts-heading" data-reveal><p className="eyebrow"><span className="eyebrow__dot" /> THE QUICK READ</p><h2 id="course-facts-title">A few useful<br /><em>details.</em></h2></div>
          <div className="course-facts-grid">
            <article className="course-fact" data-reveal><span className="course-fact__icon"><RouteIcon /></span><p>Typical duration</p><strong>{course.duration}</strong></article>
            <article className="course-fact course-fact--wide" data-reveal><span className="course-fact__icon"><CompassIcon /></span><p>Eligibility to check</p><strong>{course.eligibility}</strong></article>
            {course.fees ? <article className="course-fact" data-reveal><span className="course-fact__icon"><CheckIcon /></span><p>Fees information</p><strong>{course.fees}</strong></article> : null}
          </div>
        </div>
      </section>

      <section className="course-overview-section section-pad" aria-labelledby="overview-title">
        <div className="page-wrap course-overview-layout">
          <div className="course-overview-aside" data-reveal><p className="eyebrow"><span className="eyebrow__dot" /> ABOUT THIS COURSE</p><h2 id="overview-title">Get a feel<br />for <em>{course.name}.</em></h2></div>
          <div className="course-overview-main" data-reveal>
            <p className="course-overview-main__lead">{course.description}</p>
            <h3>What to explore</h3>
            <ul className="course-highlights">{course.highlights.map((highlight) => <li key={highlight}><span><CheckIcon /></span>{highlight}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="admission-section section-pad" aria-labelledby="admission-title">
        <div className="page-wrap admission-panel" data-reveal>
          <div><p className="eyebrow"><span className="eyebrow__dot" /> BEFORE YOU APPLY</p><h2 id="admission-title">Admission<br /><em>information.</em></h2></div>
          <div className="admission-panel__detail"><p>{course.admissionInfo}</p><span>Always use official institution information for final decisions.</span></div>
        </div>
      </section>

      {relatedCourses.length ? <section className="related-courses-section section-pad" aria-labelledby="related-title"><div className="page-wrap"><div className="section-heading section-heading--split" data-reveal><div><p className="eyebrow"><span className="eyebrow__dot" /> KEEP EXPLORING</p><h2 id="related-title">You might also<br /><em>consider.</em></h2></div><Link className="text-link related-all-link" href="/courses">View all courses <ArrowRightIcon /></Link></div><div className="course-grid course-grid--related">{relatedCourses.map((related, index) => <CourseCard course={related} index={index} key={related.id} />)}</div></div></section> : null}

      <section className="course-contact-section page-wrap" aria-labelledby="course-contact-title"><div className="course-contact-panel"><div><p className="eyebrow eyebrow--light"><span className="eyebrow__dot" /> READY TO ASK A QUESTION?</p><h2 id="course-contact-title">A course question?<br /><em>Let’s talk.</em></h2><p>Tell us what you’d like to know about {course.name} and its admission process.</p></div><div className="course-contact-panel__actions"><a className="button button--light" href={whatsappHref} target="_blank" rel="noopener noreferrer">Continue on WhatsApp <ArrowRightIcon /></a><EnquiryTrigger className="course-contact-panel__text-button" courseSlug={course.slug}>Use the enquiry form <ArrowUpRightIcon /></EnquiryTrigger></div></div></section>
    </main>
  );
}
