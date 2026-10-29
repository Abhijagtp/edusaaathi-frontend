"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Course } from "@/lib/types";
import { slugify } from "@/lib/format";
import { downloadCsvFile } from "@/lib/adminuser/mock-data";
import type { CourseDraft } from "@/lib/adminuser/types";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, Avatar, Badge, EmptyState, FieldGrid, Modal, PageHeading, Panel, SearchField, TextAreaField, TextField, Toggle } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

const blankCourse: CourseDraft = {
  name: "", slug: "", shortDescription: "", description: "", duration: "", eligibility: "", fees: null,
  highlights: [], admissionInfo: "", image: null, imageAlt: null, published: false,
};

function CourseDialog({ course, courses, onClose, onSave }: { course?: Course; courses: Course[]; onClose: () => void; onSave: (draft: CourseDraft) => void }) {
  const [draft, setDraft] = useState<CourseDraft>(() => course ? { ...course } : blankCourse);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = slugify(draft.slug || draft.name);
    if (!draft.name.trim() || !slug || !draft.shortDescription.trim() || !draft.description.trim() || !draft.duration.trim() || !draft.eligibility.trim() || !draft.admissionInfo.trim()) {
      setError("Complete the required course fields before saving.");
      return;
    }
    if (courses.some((item) => item.slug === slug && item.id !== draft.id)) {
      setError("That course URL slug is already in use.");
      return;
    }
    setError("");
    try {
      onSave({
        ...draft,
        name: draft.name.trim(),
        slug,
        shortDescription: draft.shortDescription.trim(),
        description: draft.description.trim(),
        duration: draft.duration.trim(),
        eligibility: draft.eligibility.trim(),
        fees: draft.fees?.trim() || null,
        highlights: draft.highlights.map((item) => item.trim()).filter(Boolean).slice(0, 12),
        admissionInfo: draft.admissionInfo.trim(),
        image: null,
        imageAlt: null,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Course could not be saved.");
    }
  }

  return <Modal title={course ? "Edit course" : "Add course"} description="Edit the same course fields used by the public Edusaaathi catalog. Saving here only updates this browser's demo data." onClose={onClose} size="lg" footer={<><AdminButton onClick={onClose}>Cancel</AdminButton><AdminButton variant="primary" type="submit" form="course-editor" icon="save">{course ? "Save course" : "Add course"}</AdminButton></>}>
    <form id="course-editor" onSubmit={submit} className={styles.formStack}>
      <FieldGrid>
        <TextField label="Course name" name="courseName" value={draft.name} onChange={(event) => { const name = event.target.value; setDraft((current) => ({ ...current, name, slug: !current.id || current.slug === slugify(current.name) ? slugify(name) : current.slug })); }} maxLength={80} required placeholder="e.g. BCA" />
        <TextField label="URL slug" name="courseSlug" value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} maxLength={100} required hint="Demo URL slug, for example /courses/bca. It does not change live routes." placeholder="bca" />
        <TextField label="Typical duration" name="courseDuration" value={draft.duration} onChange={(event) => setDraft((current) => ({ ...current, duration: event.target.value }))} maxLength={100} required placeholder="Typically 3 years" />
        <TextField label="Fees (optional)" name="courseFees" value={draft.fees ?? ""} onChange={(event) => setDraft((current) => ({ ...current, fees: event.target.value || null }))} maxLength={120} placeholder="Contact the institution" />
      </FieldGrid>
      <TextField label="Short description" name="courseShortDescription" value={draft.shortDescription} onChange={(event) => setDraft((current) => ({ ...current, shortDescription: event.target.value }))} maxLength={240} required placeholder="One concise sentence about the course." />
      <TextAreaField label="Course description" name="courseDescription" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={4000} required />
      <TextAreaField label="Eligibility" name="courseEligibility" value={draft.eligibility} onChange={(event) => setDraft((current) => ({ ...current, eligibility: event.target.value }))} rows={3} maxLength={1000} required />
      <TextAreaField label="Highlights (one per line, up to 12)" name="courseHighlights" value={draft.highlights.join("\n")} onChange={(event) => setDraft((current) => ({ ...current, highlights: event.target.value.split("\n").slice(0, 12) }))} rows={4} maxLength={3000} />
      <TextAreaField label="Admission information" name="courseAdmissionInfo" value={draft.admissionInfo} onChange={(event) => setDraft((current) => ({ ...current, admissionInfo: event.target.value }))} rows={4} maxLength={3000} required />
      <Toggle label="Published on website" description="When active, this course is visible on the website. Switch off to hide this course when admissions are closed or unavailable." checked={draft.published} onChange={(published) => setDraft((current) => ({ ...current, published }))} name="published" />
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
    </form>
  </Modal>;
}

export function CourseManagementPage() {
  const { courses, sourceCourses, hydrated, addCourse, updateCourse, setCoursePublished, deleteCourse } = useAdminData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All courses");
  const [dialogCourse, setDialogCourse] = useState<Course | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | undefined>();
  const filtered = useMemo(() => courses.filter((course) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${course.name} ${course.slug} ${course.shortDescription}`.toLowerCase().includes(term);
    const matchesStatus = status === "All courses" || (status === "Published" ? course.published : !course.published);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => a.name.localeCompare(b.name)), [courses, search, status]);
  const publishedCount = courses.filter((course) => course.published).length;
  const draftCount = courses.length - publishedCount;

  function saveCourse(draft: CourseDraft) {
    if (draft.id) updateCourse(draft.id, draft);
    else addCourse(draft);
    setDialogOpen(false);
    setDialogCourse(undefined);
  }

  function exportCatalog() {
    downloadCsvFile([["Course", "Slug", "Short description", "Duration", "Eligibility", "Fees", "Status", "Updated"], ...filtered.map((course) => [course.name, course.slug, course.shortDescription, course.duration, course.eligibility, course.fees ?? "", course.published ? "Published" : "Draft / Unavailable", course.updatedAt])], "edusaaathi-course-catalog.csv");
  }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="PUBLIC CATALOG" title="Course management" description="Manage courses and control their live publication status on the website. Toggle published off when a course is unavailable." actions={<><AdminButton icon="download" onClick={exportCatalog}>Export CSV</AdminButton><AdminButton variant="primary" icon="plus" onClick={() => { setDialogCourse(undefined); setDialogOpen(true); }}>Add course</AdminButton></>} />
    <div className={styles.threeStatsGrid}><div className={styles.summaryStat}><span>Total courses</span><strong>{courses.length}</strong><small>In database catalog</small></div><div className={styles.summaryStat}><span>Live on website</span><strong>{publishedCount}</strong><small>Visible to prospective students</small></div><div className={styles.summaryStat}><span>Draft / Unavailable</span><strong>{draftCount}</strong><small>Hidden from public website</small></div></div>
    <Panel title="Course catalog" subtitle={`${filtered.length} course${filtered.length === 1 ? "" : "s"}`} action={<div className={styles.panelFilters}><SearchField value={search} onChange={setSearch} placeholder="Search course or slug" label="Search courses" /><label className={styles.filterControl}><span className={styles.srOnly}>Filter courses by publication status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All courses</option><option value="Published">Published on website</option><option value="Drafts">Draft / Unavailable</option></select></label></div>}>
      {!hydrated ? <div className={styles.tableLoading}>Loading course catalog…</div> : filtered.length ? <div className={styles.tableViewport}><table className={styles.dataTable}><caption className={styles.srOnly}>Course catalog management table</caption><thead><tr><th scope="col">Course</th><th scope="col">Duration</th><th scope="col">Eligibility</th><th scope="col">Fees</th><th scope="col">Website Status</th><th scope="col">Website</th><th scope="col">Updated</th><th scope="col">Actions</th></tr></thead><tbody>{filtered.map((course) => {
        return <tr key={course.id}>
          <td><div className={styles.courseAdminCell}><Avatar name={course.name} size="sm" /><span><strong>{course.name}</strong><small>/courses/{course.slug}</small><small>{course.shortDescription}</small></span></div></td>
          <td>{course.duration}</td><td><span className={styles.courseEligibilityCell}>{course.eligibility}</span></td><td>{course.fees || "—"}</td><td><Badge dot>{course.published ? "Published" : "Unavailable"}</Badge></td>
          <td>{course.published ? <Link href={`/courses/${course.slug}`} target="_blank" rel="noreferrer" className={styles.courseLiveLink}>Live page <AdminIcon name="external" size={12} /></Link> : <span className={styles.courseLiveStatus}>Hidden</span>}</td>
          <td>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(course.updatedAt))}</td>
          <td><div className={styles.rowActions}><AdminButton className={styles.smallRowButton} icon="edit" onClick={() => { setDialogCourse(course); setDialogOpen(true); }}>Edit</AdminButton><AdminButton className={styles.smallRowButton} onClick={() => setCoursePublished(course.id, !course.published)}>{course.published ? "Hide from website" : "Publish"}</AdminButton><button type="button" className={styles.deleteCourseButton} aria-label={`Delete ${course.name}`} onClick={() => setDeleteTarget(course)}><AdminIcon name="trash" size={15} /></button></div></td>
        </tr>;
      })}</tbody></table></div> : <EmptyState title="No matching courses" description="Try a broader search or add a course to the catalog." icon="file-text" action={<AdminButton variant="primary" icon="plus" onClick={() => { setDialogCourse(undefined); setDialogOpen(true); }}>Add course</AdminButton>} />}
    </Panel>
    <div className={styles.courseDataNotice}><AdminIcon name="circle-info" size={15} /><p>All course edits and publication toggles sync live with the database. Courses set to Unavailable or Draft are immediately hidden from public student views.</p></div>
    {dialogOpen ? <CourseDialog course={dialogCourse} courses={courses} onClose={() => { setDialogOpen(false); setDialogCourse(undefined); }} onSave={saveCourse} /> : null}
    {deleteTarget ? <Modal title="Delete course?" description={`Are you sure you want to delete ${deleteTarget.name}? This will remove it from the database and public site.`} onClose={() => setDeleteTarget(undefined)} footer={<><AdminButton onClick={() => setDeleteTarget(undefined)}>Cancel</AdminButton><AdminButton variant="danger" icon="trash" onClick={() => { deleteCourse(deleteTarget.id); setDeleteTarget(undefined); }}>Delete course</AdminButton></>}><p className={styles.helperInfo}><AdminIcon name="circle-info" size={14} />This action will delete the course record.</p></Modal> : null}
  </div>;
}
