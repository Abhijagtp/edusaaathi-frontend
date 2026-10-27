import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Edusaaathi handles enquiry details shared through this website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="legal-page page-wrap">
      <p className="eyebrow"><span className="eyebrow__dot" /> YOUR INFORMATION</p>
      <h1>Privacy <em>policy.</em></h1>
      <p className="legal-page__updated">Website privacy information · Please review before launch</p>
      <div className="legal-copy">
        <p>This first-version website collects the details you submit in an enquiry form: your name, mobile number, the course you are interested in and, if you choose to share it, your city. Enquiries are stored for Edusaaathi to review and respond to.</p>
        <h2>How information is used</h2>
        <p>Information submitted through the form is used to understand your question and contact you about your enquiry. Do not include sensitive personal information in the form.</p>
        <h2>Storage and access</h2>
        <p>In this starter implementation, enquiry records are stored in the website's server-side data store and are visible to authenticated administrators. Before production, Edusaaathi should confirm its hosting, retention, access-control and deletion processes.</p>
        <h2>Third-party links</h2>
        <p>WhatsApp links open a third-party service. If you choose to continue there, that service's own privacy terms apply. A WhatsApp business number must be configured by Edusaaathi before launch.</p>
        <h2>Questions or requests</h2>
        <p>For questions about an enquiry or a request to update or remove submitted information, please contact Edusaaathi through the contact details published by the business.</p>
        <p className="legal-note">This starter privacy notice is a working draft, not legal advice. Edusaaathi should have it reviewed and replace the operational details above with its final data-handling practices before launch.</p>
      </div>
    </main>
  );
}
