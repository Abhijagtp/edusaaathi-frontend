import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { EnquiryTrigger } from "@/components/enquiry-trigger";
import { getContactEmail } from "@/lib/config";
import { getCourses } from "@/lib/data-store";

export async function SiteFooter() {
  const [email, courses] = await Promise.all([Promise.resolve(getContactEmail()), getCourses()]);
  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer__main page-wrap">
        <div className="site-footer__brand-block">
          <BrandMark light />
          <p>Thoughtful course discovery for the next step in your education journey.</p>
          <EnquiryTrigger className="footer-contact-link">Have a question? <span aria-hidden="true">↗</span></EnquiryTrigger>
          {email ? <a className="footer-email" href={`mailto:${email}`}>{email}</a> : null}
        </div>
        <div className="site-footer__links">
          <div>
            <p className="footer-label">Explore</p>
            <Link href="/courses">All courses</Link>
            <Link href="/#how">How we help</Link>
            <Link href="/#faqs">FAQs</Link>
          </div>
          <div>
            <p className="footer-label">Courses</p>
            {courses.slice(0, 5).map((course) => <Link href={`/courses/${course.slug}`} key={course.id}>{course.name}</Link>)}
            {!courses.length ? <Link href="/courses">Browse courses</Link> : null}
          </div>
          <div>
            <p className="footer-label">Information</p>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
            <Link href="/admin/login">Admin</Link>
          </div>
        </div>
      </div>
      <div className="site-footer__cinematic" aria-hidden="true">
        <span className="site-footer__cinematic-orbit" />
        <p className="site-footer__cinematic-kicker">Your next chapter, thoughtfully guided</p>
        <p className="site-footer__wordmark">Edusaaathi</p>
        <div className="site-footer__cinematic-caption">
          <span>EDUCATION · GUIDANCE · POSSIBILITY</span>
          <span>YOUR JOURNEY, YOUR PACE</span>
        </div>
      </div>
      <div className="site-footer__bottom page-wrap">
        <span>© {new Date().getFullYear()} Edusaaathi Education Consultancy</span>
        <span>Made for the next step.</span>
      </div>
    </footer>
  );
}
