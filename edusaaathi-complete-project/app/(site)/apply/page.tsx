import type { Metadata } from "next";
import { Suspense } from "react";
import { ApplyFormClient } from "./apply-form-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apply for Course Admission & Counselling | Edusaaathi",
  description: "Submit your student application for expert academic counselling, university admissions, and personalized course guidance.",
  alternates: { canonical: "/apply" },
};

export default function ApplyPage() {
  return (
    <main id="main-content" className="apply-page">
      <Suspense fallback={<div className="page-wrap section-pad" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}><p>Loading application portal…</p></div>}>
        <ApplyFormClient />
      </Suspense>
    </main>
  );
}
