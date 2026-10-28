"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Course } from "@/lib/types";
import { CloseIcon, CheckIcon } from "@/components/icons";

type PopupRequest = { courseSlug?: string };

type FormState = "idle" | "saving" | "success" | "error";

export function EnquiryPopup() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSlug, setCourseSlug] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let delay: number | undefined;
    try {
      const lastDismissed = Number(window.localStorage.getItem("coursesathi-popup-dismissed") || 0);
      const cooledDown = lastDismissed && Date.now() - lastDismissed < 7 * 24 * 60 * 60 * 1000;
      if (!cooledDown) delay = window.setTimeout(() => setOpen(true), 11500);
    } catch {
      delay = window.setTimeout(() => setOpen(true), 11500);
    }

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlRef = searchParams.get("ref");
      if (urlRef) {
        window.localStorage.setItem("coursesathi-ref", urlRef);
      }
    } catch {
      // storage unavailable
    }

    const requestOpen = (event: Event) => {
      const customEvent = event as CustomEvent<PopupRequest>;
      if (customEvent.detail?.courseSlug) setCourseSlug(customEvent.detail.courseSlug);
      setState("idle");
      setMessage("");
      setOpen(true);
    };
    window.addEventListener("coursesathi:open-enquiry", requestOpen);
    return () => {
      if (delay) window.clearTimeout(delay);
      window.removeEventListener("coursesathi:open-enquiry", requestOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch("/api/courses", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { courses?: Course[] }) => {
        if (active && Array.isArray(data.courses)) {
          setCourses(data.courses);
          setCourseSlug((current) => current || data.courses?.[0]?.slug || "");
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function dismiss() {
    setOpen(false);
    try { window.localStorage.setItem("coursesathi-popup-dismissed", String(Date.now())); } catch { /* storage can be unavailable */ }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("saving");
    setMessage("");
    const form = new FormData(event.currentTarget);
    let ref = "";
    try {
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      ref = searchParams?.get("ref") || window.localStorage.getItem("coursesathi-ref") || "";
    } catch {
      // storage unavailable
    }
    const payload = {
      fullName: String(form.get("fullName") || ""),
      mobile: String(form.get("mobile") || ""),
      courseSlug,
      city: String(form.get("city") || ""),
      ref,
    };
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "We couldn't save your enquiry. Please try again.");
      setState("success");
      setMessage(data.message || "Thank you. Your enquiry has been saved.");
      try { window.localStorage.setItem("coursesathi-popup-dismissed", String(Date.now())); } catch { /* storage can be unavailable */ }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "We couldn't save your enquiry. Please try again.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="enquiry-dialog"
      aria-labelledby="enquiry-title"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}
    >
      <div className="enquiry-dialog__panel">
        <button className="enquiry-dialog__close" type="button" onClick={dismiss} aria-label="Close enquiry form"><CloseIcon /></button>
        {state === "success" ? (
          <div className="enquiry-success" role="status" aria-live="polite">
            <span className="enquiry-success__icon"><CheckIcon /></span>
            <p className="eyebrow">THANK YOU</p>
            <h2 id="enquiry-title">We have your enquiry.</h2>
            <p>{message}</p>
            <button className="button button--primary" type="button" onClick={dismiss}>Done <span aria-hidden="true">→</span></button>
          </div>
        ) : (
          <>
            <div className="enquiry-dialog__intro">
              <p className="eyebrow">A CONVERSATION CAN HELP</p>
              <h2 id="enquiry-title">Looking for the Right Course?</h2>
              <p>Tell us a little about what you’re looking for. We’ll take it from there.</p>
            </div>
            <form className="enquiry-form" onSubmit={submit}>
              <label>Full name
                <input ref={firstFieldRef} name="fullName" autoComplete="name" placeholder="Your name" required minLength={2} maxLength={80} />
              </label>
              <label>Mobile number
                <input name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" required pattern="[6-9][0-9]{9}" minLength={10} maxLength={10} title="Enter a 10-digit Indian mobile number" />
              </label>
              <label>Interested course
                <select value={courseSlug} onChange={(event) => setCourseSlug(event.target.value)} required>
                  {courses.length === 0 ? <option value="">Loading courses…</option> : null}
                  {courses.map((course) => <option value={course.slug} key={course.id}>{course.name}</option>)}
                </select>
              </label>
              <label>City <span className="optional-label">Optional</span>
                <input name="city" autoComplete="address-level2" placeholder="e.g. Mumbai" maxLength={80} />
              </label>
              {state === "error" ? <p className="form-message form-message--error" role="alert">{message}</p> : null}
              <button className="button button--primary enquiry-form__submit" type="submit" disabled={state === "saving" || courses.length === 0}>
                {state === "saving" ? "Saving…" : "Submit Enquiry"} <span aria-hidden="true">→</span>
              </button>
              <p className="enquiry-form__privacy">By submitting, you agree to our <a href="/privacy">privacy policy</a>.</p>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
