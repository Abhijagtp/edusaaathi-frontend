import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using the Edusaaathi course-discovery and enquiry website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main id="main-content" className="legal-page page-wrap">
      <p className="eyebrow"><span className="eyebrow__dot" /> USING THIS WEBSITE</p>
      <h1>Terms of <em>use.</em></h1>
      <p className="legal-page__updated">Website terms · Please review before launch</p>
      <div className="legal-copy">
        <p>Edusaaathi provides course-discovery information and a way to submit an enquiry. You may use this website to explore course topics and ask for further guidance.</p>
        <h2>Course information</h2>
        <p>Course durations, eligibility, fees and admissions information can vary by institution, programme and intake. Information on this website is a general starting point and should not be treated as a guarantee of eligibility, admission, fees or any educational outcome. Confirm current details with the relevant institution.</p>
        <h2>Enquiries</h2>
        <p>Please provide accurate contact details when submitting an enquiry and do not submit information on behalf of another person without permission. Submitting a form does not create an admission application or guarantee a response time.</p>
        <h2>External services</h2>
        <p>Links to services such as WhatsApp are provided for convenience. Edusaaathi does not control those services or their content.</p>
        <h2>Updates</h2>
        <p>Edusaaathi may update website content and these terms. The final terms should identify the legal business entity and include any additional provisions required for the service.</p>
        <p className="legal-note">This starter terms page is a working draft, not legal advice. Review and replace it with approved terms and complete business contact details before launch.</p>
      </div>
    </main>
  );
}
