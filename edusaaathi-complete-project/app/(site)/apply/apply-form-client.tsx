"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export function ApplyFormClient() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isOtherCourse, setIsOtherCourse] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [submittedName, setSubmittedName] = useState("");
  const [submittedMobile, setSubmittedMobile] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // 1. Capture referral code from URL query (?ref=DARSHA03) or localStorage
    try {
      const urlRef = searchParams.get("ref");
      if (urlRef) {
        const cleaned = urlRef.trim().toUpperCase();
        window.localStorage.setItem("coursesathi-ref", cleaned);
        setReferralCode(cleaned);
      } else {
        const saved = window.localStorage.getItem("coursesathi-ref");
        if (saved) setReferralCode(saved.trim().toUpperCase());
      }
    } catch {
      // storage unavailable
    }

    // 2. Fetch live dynamic courses
    let active = true;
    fetch("/api/courses", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { courses?: Course[] }) => {
        if (!active) return;
        setLoadingCourses(false);
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          setCourses(data.courses);
          const courseParam = searchParams.get("course");
          const matched = courseParam
            ? data.courses.find(
                (c) => c.slug.toLowerCase() === courseParam.toLowerCase() || c.name.toLowerCase() === courseParam.toLowerCase()
              )
            : null;
          if (matched) {
            setSelectedCourse(matched.slug);
          } else {
            setSelectedCourse(data.courses[0].slug);
          }
        }
      })
      .catch(() => {
        if (active) setLoadingCourses(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  function handleCourseChange(val: string) {
    setSelectedCourse(val);
    setIsOtherCourse(val === "other");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const mobile = String(form.get("mobile") || "").trim();
    const email = String(form.get("email") || "").trim();
    const city = String(form.get("city") || "").trim();
    const otherCourseText = String(form.get("otherCourse") || "").trim();

    // Indian 10-digit mobile check
    const cleanMobile = mobile.replace(/[\s\-\(\)\+]/g, "").replace(/^91/, "");
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setState("error");
      setErrorMessage("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    // Ensure referral code is attached from state or query/storage
    let ref = referralCode;
    if (!ref) {
      try {
        ref = (searchParams.get("ref") || window.localStorage.getItem("coursesathi-ref") || "").trim().toUpperCase();
      } catch {
        // storage unavailable
      }
    }

    const payload = {
      fullName,
      mobile: cleanMobile,
      email: email || undefined,
      courseSlug: isOtherCourse ? "other" : selectedCourse,
      otherCourse: isOtherCourse ? otherCourseText : undefined,
      city: city || undefined,
      ref,
      referral_code: ref,
      source: ref ? `Referral Link (${ref})` : "Website Direct Apply",
    };

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit your application. Please check your details and try again.");
      }

      setSubmittedName(fullName);
      setSubmittedMobile(cleanMobile);
      setState("success");

      try {
        window.localStorage.setItem("coursesathi-popup-dismissed", String(Date.now()));
      } catch {
        // storage unavailable
      }
    } catch (err) {
      setState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit application. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <section className="page-wrap section-pad">
        <div style={{ maxWidth: "600px", margin: "0 auto", background: "#ffffff", borderRadius: "16px", padding: "40px 32px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px rgba(0,0,0,0.04)", textAlign: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "grid", placeItems: "center", margin: "0 auto 20px auto", fontSize: "28px" }}>
            <CheckIcon />
          </div>
          <p className="eyebrow"><span className="eyebrow__dot" /> APPLICATION RECEIVED</p>
          <h1 style={{ fontSize: "28px", fontWeight: "750", margin: "12px 0", color: "var(--ink)" }}>
            Thank You, {submittedName}!
          </h1>
          <p style={{ color: "#475569", fontSize: "15px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
            Your admission & counselling request has been registered. Our senior academic advisor has been assigned and will contact you shortly on <strong>+91 {submittedMobile}</strong> to discuss courses, eligibility, and scholarship options.
          </p>
          {referralCode ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", marginBottom: "28px" }}>
              <span>✓</span> Assigned under partner referral ID: {referralCode}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/courses" className="button button--primary">
              Explore Course Guides <ArrowRightIcon />
            </Link>
            <Link href="/" className="button button--secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-wrap section-pad">
      <div className="breadcrumbs" style={{ marginBottom: "16px" }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span>Student Application</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ background: "#ffffff", borderRadius: "18px", padding: "36px 32px", border: "1px solid #e2e8f0", boxShadow: "0 12px 36px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: "24px" }}>
            <p className="eyebrow">
              <span className="eyebrow__dot" /> ADMISSION & COUNSELLING
            </p>
            <h1 style={{ fontSize: "28px", fontWeight: "750", color: "var(--ink)", margin: "8px 0 10px 0" }}>
              Student Application Form
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
              Fill in your details to get free, personalized 1-on-1 admission guidance, fee structures, and scholarship assistance from our certified education counselors.
            </p>
            {referralCode ? (
              <div style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "8px", background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#334155", padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                <span style={{ color: "#059669" }}>●</span> Direct Consultant Referral Link Active
              </div>
            ) : null}
          </div>

          <form className="enquiry-form" onSubmit={handleSubmit} style={{ marginTop: 0 }}>
            <label>
              Full name
              <input
                name="fullName"
                autoComplete="name"
                placeholder="Enter your full name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>

            <label>
              Mobile number
              <input
                name="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                required
                pattern="[6-9][0-9]{9}"
                minLength={10}
                maxLength={10}
                title="Enter a 10-digit Indian mobile number"
              />
            </label>

            <label>
              Email address <span className="optional-label">Optional</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={80}
              />
            </label>

            <label>
              Interested course / Degree program
              <select
                value={selectedCourse}
                onChange={(e) => handleCourseChange(e.target.value)}
                required
                disabled={loadingCourses}
              >
                {loadingCourses ? <option value="">Loading course options…</option> : null}
                {courses.map((course) => (
                  <option value={course.slug} key={course.id}>
                    {course.name}{course.duration ? ` (${course.duration})` : ""}
                  </option>
                ))}
                <option value="other">Other / Not Listed Above</option>
              </select>
            </label>

            {isOtherCourse ? (
              <label>
                Please specify your course of interest
                <input
                  name="otherCourse"
                  placeholder="e.g. B.Tech Data Science, BA Psychology"
                  required
                  maxLength={100}
                />
              </label>
            ) : null}

            <label>
              Current City / Location <span className="optional-label">Optional</span>
              <input
                name="city"
                autoComplete="address-level2"
                placeholder="e.g. Mumbai, Pune, Delhi, Bangalore"
                maxLength={80}
              />
            </label>

            {state === "error" ? (
              <p className="form-message form-message--error" role="alert" style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", margin: "4px 0" }}>
                {errorMessage}
              </p>
            ) : null}

            <button
              className="button button--primary enquiry-form__submit"
              type="submit"
              disabled={state === "saving" || loadingCourses}
              style={{ marginTop: "8px", minHeight: "46px", fontSize: "14px" }}
            >
              {state === "saving" ? "Submitting Application…" : "Submit Application"} <span aria-hidden="true">→</span>
            </button>

            <p className="enquiry-form__privacy">
              By submitting, you agree to our <Link href="/privacy">privacy policy</Link> and terms.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
