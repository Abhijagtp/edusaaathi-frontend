import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { CourseCard } from "@/components/course-card";
import { FaqList } from "@/components/faq-list";
import { EnquiryTrigger } from "@/components/enquiry-trigger";
import { ArrowRightIcon, ArrowUpRightIcon, BookIcon, CheckIcon, CompassIcon, RouteIcon, SparkIcon } from "@/components/icons";
import { getCourses } from "@/lib/data-store";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find the Right Course. Build Your Future.",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Find the Right Course. Build Your Future. | Edusaaathi",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
};

const courseOrder = ["bca", "bba", "mba", "b-tech", "mca", "b-com"];

export default async function HomePage() {
  const courses = await getCourses();
  const orderedCourses = [...courses].sort((a, b) => {
    const aIndex = courseOrder.indexOf(a.slug);
    const bIndex = courseOrder.indexOf(b.slug);
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
  });
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Hero />

      <section id="courses" className="course-section section-pad" aria-labelledby="courses-title">
        <div className="page-wrap">
          <div className="section-heading section-heading--split" data-reveal>
            <div>
              <p className="eyebrow"><span className="eyebrow__dot" /> COURSE DISCOVERY</p>
              <h2 id="courses-title">Explore Courses<br /><em>That Match Your Goals</em></h2>
            </div>
            <div className="section-heading__aside">
              <p>Start with a course that catches your interest. Compare what you’ll study, how long it may take and what eligibility to check.</p>
              <span className="small-note">Course details can vary by institution.</span>
            </div>
          </div>
          {orderedCourses.length ? (
            <div className="course-grid">
              {orderedCourses.map((course, index) => <CourseCard course={course} index={index} key={course.id} />)}
            </div>
          ) : (
            <p className="empty-courses">Course guides are being updated. Please check back soon.</p>
          )}
          <div className="course-section__foot" data-reveal>
            <span className="quiet-note">A starting point for your research, not a substitute for institution-specific information.</span>
            <Link href="/courses" className="text-link">View All Courses <ArrowRightIcon /></Link>
          </div>
        </div>
      </section>

      <section id="how" className="how-section section-pad" aria-labelledby="how-title">
        <div className="page-wrap">
          <div className="how-section__intro" data-reveal>
            <p className="eyebrow"><span className="eyebrow__dot" /> A CLEARER WAY FORWARD</p>
            <h2 id="how-title">How Edusaaathi<br /><em>Helps</em></h2>
            <p className="how-section__lead">Good decisions begin with useful information. Move at your own pace, with a little more clarity at each step.</p>
          </div>
          <div className="steps-row" data-reveal-sequence>
            <article className="help-step" data-reveal-item>
              <span className="help-step__number">01</span>
              <span className="help-step__icon"><CompassIcon /></span>
              <h3>Explore</h3>
              <p>Discover available courses and educational options that spark your interest.</p>
              <span className="help-step__rule" />
            </article>
            <article className="help-step" data-reveal-item>
              <span className="help-step__number">02</span>
              <span className="help-step__icon"><BookIcon /></span>
              <h3>Understand</h3>
              <p>Review eligibility, duration, fees and admission details before you decide.</p>
              <span className="help-step__rule" />
            </article>
            <article className="help-step" data-reveal-item>
              <span className="help-step__number">03</span>
              <span className="help-step__icon"><RouteIcon /></span>
              <h3>Enquire</h3>
              <p>Contact Edusaaathi with your questions and take the next step in your own time.</p>
              <span className="help-step__rule" />
            </article>
          </div>
          <div className="how-section__bottom" data-reveal><span>YOUR JOURNEY, AT YOUR PACE</span><span className="how-section__bottom-line" /><SparkIcon /></div>
        </div>
      </section>

      <section id="why" className="why-section section-pad" aria-labelledby="why-title">
        <div className="page-wrap why-layout">
          <div className="why-intro" data-reveal>
            <p className="eyebrow"><span className="eyebrow__dot" /> WHY EDUSAAATHI</p>
            <h2 id="why-title">A good next step<br />starts with <em>clarity.</em></h2>
            <p>Choosing a course can bring up a lot of questions. Edusaaathi helps you make sense of the options and find the information to move forward thoughtfully.</p>
            <div className="why-orbit" data-parallax aria-hidden="true"><span className="why-orbit__centre"><RouteIcon /></span><i /><b /></div>
          </div>
          <div className="why-list" data-reveal-sequence>
            <article className="why-item" data-reveal-item>
              <span className="why-item__index">01</span>
              <div><h3>Course discovery</h3><p>Explore course options and get a clearer picture of what each one involves.</p></div>
              <span className="why-item__icon"><CompassIcon /></span>
            </article>
            <article className="why-item" data-reveal-item>
              <span className="why-item__index">02</span>
              <div><h3>Eligibility guidance</h3><p>Understand which requirements to look for and where institution criteria may differ.</p></div>
              <span className="why-item__icon"><CheckIcon /></span>
            </article>
            <article className="why-item" data-reveal-item>
              <span className="why-item__index">03</span>
              <div><h3>Enquiry assistance</h3><p>Ask your questions and get help navigating the information you need next.</p></div>
              <span className="why-item__icon"><ArrowUpRightIcon /></span>
            </article>
            <p className="why-disclaimer">Edusaaathi shares guidance to support your research. Always confirm admission decisions, fees and eligibility with the relevant institution.</p>
          </div>
        </div>
      </section>

      <section className="counselling-section section-pad" aria-labelledby="counselling-title">
        <div className="page-wrap">
          <div className="counselling-panel" data-reveal>
            <div className="counselling-panel__content">
              <p className="eyebrow eyebrow--light"><span className="eyebrow__dot" /> A LITTLE GUIDANCE GOES A LONG WAY</p>
              <h2 id="counselling-title">Not Sure Which Course<br /><em>to Choose?</em></h2>
              <p>Tell us what you're looking for and take the next step with Edusaaathi.</p>
              <EnquiryTrigger className="button button--light">Get in Touch <ArrowRightIcon /></EnquiryTrigger>
            </div>
          </div>
        </div>
      </section>

      <section id="faqs" className="faq-section section-pad" aria-labelledby="faq-title">
        <div className="page-wrap faq-layout">
          <div className="faq-intro" data-reveal>
            <p className="eyebrow"><span className="eyebrow__dot" /> GOOD QUESTIONS</p>
            <h2 id="faq-title">A few things<br />you might <em>wonder.</em></h2>
            <p>Still curious? Browse courses or send us your question.</p>
            <Link href="/courses" className="text-link">Browse course guides <ArrowRightIcon /></Link>
          </div>
          <FaqList />
        </div>
      </section>
      <div className="home-endnote"><span className="home-endnote__line" /> One clear step can change the view ahead <span className="home-endnote__line" /></div>
    </main>
  );
}
