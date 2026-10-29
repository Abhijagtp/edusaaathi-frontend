"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ArrowRightIcon, ArrowUpRightIcon, CloseIcon, SparkIcon } from "@/components/icons";
import { formatDate, slugify } from "@/lib/format";
import type { Course, Lead, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";

type Tab = "overview" | "courses" | "enquiries";
type CourseDraft = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  duration: string;
  eligibility: string;
  fees: string;
  highlightsText: string;
  admissionInfo: string;
  image: string;
  imageAlt: string;
  published: boolean;
};

const emptyDraft: CourseDraft = {
  name: "", slug: "", shortDescription: "", description: "", duration: "", eligibility: "", fees: "", highlightsText: "", admissionInfo: "", image: "", imageAlt: "", published: true,
};

function toDraft(course: Course): CourseDraft {
  return {
    name: course.name,
    slug: course.slug,
    shortDescription: course.shortDescription,
    description: course.description,
    duration: course.duration,
    eligibility: course.eligibility,
    fees: course.fees || "",
    highlightsText: course.highlights.join("\n"),
    admissionInfo: course.admissionInfo,
    image: course.image || "",
    imageAlt: course.imageAlt || "",
    published: course.published,
  };
}

function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`status-pill status-pill--${slugify(status)}`}>{status}</span>;
}

export function AdminDashboard() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [courses, setCourses] = useState<Course[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CourseDraft>(emptyDraft);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseResponse, leadResponse] = await Promise.all([
        fetch("/api/admin/courses", { cache: "no-store" }),
        fetch("/api/admin/leads", { cache: "no-store" }),
      ]);
      if (courseResponse.status === 401 || leadResponse.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const [courseData, leadData] = await Promise.all([courseResponse.json(), leadResponse.json()]) as [
        { courses?: Course[]; error?: string },
        { leads?: Lead[]; error?: string },
      ];
      if (!courseResponse.ok || !leadResponse.ok) throw new Error(courseData.error || leadData.error || "Unable to load admin data.");
      setCourses(courseData.courses || []);
      setLeads(leadData.leads || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (formOpen && !dialog.open) dialog.showModal();
    if (!formOpen && dialog.open) dialog.close();
  }, [formOpen]);

  const filteredLeads = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === "All statuses" || lead.status === statusFilter;
      const searchable = `${lead.fullName} ${lead.mobile} ${lead.courseName} ${lead.city}`.toLowerCase();
      return matchesStatus && (!normalized || searchable.includes(normalized));
    });
  }, [leads, search, statusFilter]);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
    setFormOpen(true);
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setDraft(toDraft(course));
    setError("");
    setFormOpen(true);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...draft,
      slug: slugify(draft.slug || draft.name),
      highlights: draft.highlightsText.split("\n").map((item) => item.trim()).filter(Boolean),
    };
    try {
      const response = await fetch(editingId ? `/api/admin/courses/${editingId}` : "/api/admin/courses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Course could not be saved.");
      setFormOpen(false);
      setNotice(editingId ? "Course guide updated." : "Course guide added.");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Course could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(course: Course) {
    setError("");
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !course.published }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Course status could not be updated.");
      setNotice(`${course.name} ${course.published ? "unpublished" : "published"}.`);
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Course status could not be updated.");
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete the ${course.name} course guide? This cannot be undone.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Course could not be deleted.");
      setNotice(`${course.name} course guide deleted.`);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Course could not be deleted.");
    }
  }

  async function updateLeadStatus(lead: Lead, status: LeadStatus) {
    setError("");
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Enquiry status could not be updated.");
      setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
      setNotice(`Updated ${lead.fullName}’s enquiry.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Enquiry status could not be updated.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin-shell" id="main-content">
      <header className="admin-topbar">
        <BrandMark />
        <div className="admin-topbar__right"><span><i /> PRIVATE WORKSPACE</span><button type="button" onClick={logout}>Sign out <ArrowUpRightIcon /></button></div>
      </header>
      <div className="admin-main page-wrap">
        <div className="admin-welcome">
          <div><p className="eyebrow"><span className="eyebrow__dot" /> EDUSAAATHI · ADMIN</p><h1>Your workspace<span>.</span></h1><p>Course guides and enquiries, all in one place.</p></div>
          <Link href="/" className="admin-preview-link" target="_blank" rel="noreferrer">View website <ArrowUpRightIcon /></Link>
        </div>
        {notice ? <div className="admin-notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}><CloseIcon /></button></div> : null}
        {error ? <div className="admin-error" role="alert">{error}<button type="button" aria-label="Dismiss error" onClick={() => setError("")}><CloseIcon /></button></div> : null}

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button type="button" role="tab" aria-selected={tab === "overview"} className={tab === "overview" ? "is-active" : ""} onClick={() => setTab("overview")}>Overview</button>
          <button type="button" role="tab" aria-selected={tab === "courses"} className={tab === "courses" ? "is-active" : ""} onClick={() => setTab("courses")}>Course guides <span>{courses.length}</span></button>
          <button type="button" role="tab" aria-selected={tab === "enquiries"} className={tab === "enquiries" ? "is-active" : ""} onClick={() => setTab("enquiries")}>Enquiries <span>{leads.length}</span></button>
        </div>

        {loading ? <div className="admin-loading" role="status"><span className="admin-loading__spinner" /> Loading workspace…</div> : null}

        {!loading && tab === "overview" ? (
          <section className="admin-overview" aria-labelledby="overview-heading">
            <h2 className="sr-only" id="overview-heading">Admin overview</h2>
            <div className="admin-stats">
              <article className="admin-stat"><span>COURSE GUIDES</span><strong>{courses.length}</strong><small>Published and draft content</small></article>
              <article className="admin-stat admin-stat--highlight"><span>ALL ENQUIRIES</span><strong>{leads.length}</strong><small>Saved website enquiries</small></article>
              <article className="admin-stat"><span>NEW ENQUIRIES</span><strong>{leads.filter((lead) => lead.status === "New").length}</strong><small>Awaiting first contact</small></article>
            </div>
            <div className="admin-overview__lower">
              <div className="admin-panel admin-panel--recent"><div className="admin-panel__heading"><div><p className="eyebrow"><span className="eyebrow__dot" /> RECENT ACTIVITY</p><h2>Latest enquiries</h2></div><button type="button" className="admin-inline-link" onClick={() => setTab("enquiries")}>View all <ArrowRightIcon /></button></div>
                {leads.length ? <div className="recent-leads">{leads.slice(0, 4).map((lead) => <article key={lead.id}><div className="recent-lead__initial">{lead.fullName.slice(0, 1).toUpperCase()}</div><div className="recent-lead__copy"><strong>{lead.fullName}</strong><span>{lead.courseName}{lead.city ? ` · ${lead.city}` : ""}</span></div><StatusPill status={lead.status} /></article>)}</div> : <div className="admin-empty"><SparkIcon /><p>No enquiries yet. New website submissions will appear here.</p></div>}
              </div>
              <div className="admin-panel admin-panel--quick"><p className="eyebrow"><span className="eyebrow__dot" /> QUICK ACTION</p><h2>Keep course details current.</h2><p>Edit the guides visitors see, or add a new course option.</p><button className="button button--primary" type="button" onClick={startCreate}>Add a course <ArrowRightIcon /></button></div>
            </div>
          </section>
        ) : null}

        {!loading && tab === "courses" ? (
          <section className="admin-content" aria-labelledby="course-admin-heading">
            <div className="admin-content__heading"><div><p className="eyebrow"><span className="eyebrow__dot" /> COURSE LIBRARY</p><h2 id="course-admin-heading">Course guides</h2><p>Update the information shown on the public website.</p></div><button className="button button--primary" type="button" onClick={startCreate}>Add course <ArrowRightIcon /></button></div>
            <div className="admin-course-list">{courses.length ? courses.map((course) => <article className="admin-course-row" key={course.id}>
              <div className="admin-course-row__mark">{course.name.replace(/[^A-Z]/g, "").slice(0, 3)}</div>
              <div className="admin-course-row__copy"><div><h3>{course.name}</h3><span className={`admin-publish-state ${course.published ? "is-published" : "is-draft"}`}>{course.published ? "Published" : "Draft"}</span></div><p>{course.shortDescription}</p><span className="admin-course-row__detail">{course.duration} <i /> {course.eligibility}</span></div>
              <div className="admin-course-row__actions"><button type="button" onClick={() => startEdit(course)}>Edit</button><button type="button" onClick={() => void togglePublished(course)}>{course.published ? "Unpublish" : "Publish"}</button><button className="is-danger" type="button" onClick={() => void deleteCourse(course)}>Delete</button></div>
            </article>) : <div className="admin-empty"><SparkIcon /><p>No course guides yet. Add one to get started.</p></div>}</div>
          </section>
        ) : null}

        {!loading && tab === "enquiries" ? (
          <section className="admin-content" aria-labelledby="leads-heading">
            <div className="admin-content__heading"><div><p className="eyebrow"><span className="eyebrow__dot" /> INCOMING QUESTIONS</p><h2 id="leads-heading">Enquiries</h2><p>Search, review contact details and keep each status up to date.</p></div></div>
            <div className="lead-toolbar"><label className="lead-search"><span className="sr-only">Search enquiries</span><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, mobile, course or city" /></label><label className="lead-filter"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label></div>
            <div className="lead-table-wrap"><table className="lead-table"><thead><tr><th>Student</th><th>Interested course</th><th>Submitted</th><th>Status</th></tr></thead><tbody>
              {filteredLeads.map((lead) => <tr key={lead.id}><td><strong>{lead.fullName}</strong><a href={`tel:${lead.mobile}`}>{lead.mobile}</a>{lead.city ? <span>{lead.city}</span> : null}</td><td>{lead.courseName}</td><td>{formatDate(lead.createdAt)}</td><td><label className="sr-only" htmlFor={`status-${lead.id}`}>Status for {lead.fullName}</label><select id={`status-${lead.id}`} className={`status-select status-select--${slugify(lead.status)}`} value={lead.status} onChange={(event) => void updateLeadStatus(lead, event.target.value as LeadStatus)}>{LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}
            </tbody></table>{filteredLeads.length === 0 ? <div className="admin-empty"><SparkIcon /><p>{leads.length ? "No enquiries match those filters." : "No enquiries have been submitted yet."}</p></div> : null}</div>
          </section>
        ) : null}
      </div>

      <dialog ref={dialogRef} className="admin-course-dialog" aria-labelledby="course-dialog-title" onCancel={(event) => { event.preventDefault(); setFormOpen(false); }}>
        <div className="admin-course-dialog__inner">
          <button type="button" className="admin-course-dialog__close" aria-label="Close course form" onClick={() => setFormOpen(false)}><CloseIcon /></button>
          <p className="eyebrow"><span className="eyebrow__dot" /> EDIT COURSE CONTENT</p>
          <h2 id="course-dialog-title">{editingId ? "Update course" : "Add a course"}<span>.</span></h2>
          <p className="admin-course-dialog__intro">Keep descriptions clear and confirm institution-specific details before publishing.</p>
          <form className="admin-course-form" onSubmit={saveCourse}>
            <div className="admin-form-grid">
              <label>Course name *<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value, slug: editingId ? draft.slug : slugify(event.target.value) })} required maxLength={80} placeholder="e.g. BCA" /></label>
              <label>URL slug *<input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: slugify(event.target.value) })} required maxLength={100} placeholder="e.g. bca" /></label>
              <label className="admin-form-grid__full">Short description *<input value={draft.shortDescription} onChange={(event) => setDraft({ ...draft, shortDescription: event.target.value })} required maxLength={240} placeholder="A concise summary for course cards" /></label>
              <label className="admin-form-grid__full">Course description *<textarea rows={4} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required maxLength={4000} /></label>
              <label>Duration *<input value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} required maxLength={100} placeholder="e.g. Typically 3 years" /></label>
              <label>Fees (optional)<input value={draft.fees} onChange={(event) => setDraft({ ...draft, fees: event.target.value })} maxLength={120} placeholder="Leave blank if not supplied" /></label>
              <label className="admin-form-grid__full">Eligibility *<textarea rows={2} value={draft.eligibility} onChange={(event) => setDraft({ ...draft, eligibility: event.target.value })} required maxLength={1000} /></label>
              <label className="admin-form-grid__full">Highlights <span className="admin-label-note">One point per line</span><textarea rows={4} value={draft.highlightsText} onChange={(event) => setDraft({ ...draft, highlightsText: event.target.value })} placeholder="Enter one course highlight per line" /></label>
              <label className="admin-form-grid__full">Admission information *<textarea rows={3} value={draft.admissionInfo} onChange={(event) => setDraft({ ...draft, admissionInfo: event.target.value })} required maxLength={3000} /></label>
            </div>
            <label className="admin-publish-toggle"><input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span><strong>Publish this course guide</strong><small>Published content is visible on the public website.</small></span></label>
            {error ? <p className="admin-form-error" role="alert">{error}</p> : null}
            <div className="admin-course-form__actions"><button className="button button--primary" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Add course"}<ArrowRightIcon /></button><button className="button button--quiet" type="button" onClick={() => setFormOpen(false)}>Cancel</button></div>
          </form>
        </div>
      </dialog>
      <footer className="admin-footer page-wrap"><span>Edusaaathi admin workspace</span><Link href="/">Return to public website <ArrowUpRightIcon /></Link></footer>
    </main>
  );
}
