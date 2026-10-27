"use client";

import { useState, type FormEvent } from "react";
import type { Consultant, Lead, LeadDraft, LeadSource } from "@/lib/adminuser/types";
import { COURSE_OPTIONS, LEAD_SOURCES, LEAD_STATUSES } from "@/lib/adminuser/mock-data";
import { AdminButton, FieldGrid, Modal, SelectField, TextField } from "./admin-ui";
import styles from "./admin.module.css";

const blankDraft: LeadDraft = {
  studentName: "", phone: "", email: "", course: COURSE_OPTIONS[0], source: "Website", sourcePage: "/courses",
  referredByConsultantId: null, assignedConsultantId: null, status: "New", lastContactedAt: null,
};

function toDraft(lead?: Lead): LeadDraft {
  if (!lead) return blankDraft;
  return {
    id: lead.id, studentName: lead.studentName, phone: lead.phone, email: lead.email, course: lead.course, source: lead.source,
    sourcePage: lead.sourcePage, referredByConsultantId: lead.referredByConsultantId, assignedConsultantId: lead.assignedConsultantId,
    status: lead.status, lastContactedAt: lead.lastContactedAt,
  };
}

export function LeadDialog({ lead, consultants, onClose, onSubmit }: { lead?: Lead; consultants: Consultant[]; onClose: () => void; onSubmit: (draft: LeadDraft) => void }) {
  const [draft, setDraft] = useState<LeadDraft>(() => toDraft(lead));
  const [error, setError] = useState("");

  function update<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.source === "Consultant referral" && !draft.referredByConsultantId) {
      setError("Choose the consultant who originally referred this lead.");
      return;
    }
    setError("");
    onSubmit(draft);
  }

  const consultantOptions = [{ value: "", label: "Unassigned" }, ...consultants.map((item) => ({ value: item.id, label: `${item.name}${item.status === "Inactive" ? " · Inactive" : ""}` }))];
  return (
    <Modal title={lead ? "Edit lead" : "Add lead"} description="Keep student details and referral attribution clear and separate." onClose={onClose} size="lg" footer={<><AdminButton onClick={onClose}>Cancel</AdminButton><AdminButton variant="primary" type="submit" form="lead-editor">{lead ? "Save changes" : "Add lead"}</AdminButton></>}>
      <form id="lead-editor" onSubmit={submit} className={styles.formStack}>
        <FieldGrid>
          <TextField label="Student name" name="studentName" value={draft.studentName} onChange={(event) => update("studentName", event.target.value)} required autoFocus placeholder="e.g. Aditi Sharma" />
          <TextField label="Phone" name="phone" type="tel" value={draft.phone} onChange={(event) => update("phone", event.target.value)} required placeholder="+91 98765 43210" />
          <TextField label="Email" name="email" type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} required placeholder="student@example.com" />
          <SelectField label="Interested course" name="course" value={draft.course} onChange={(event) => update("course", event.target.value)} options={COURSE_OPTIONS.map((course) => ({ value: course, label: course }))} />
          <SelectField label="Lead source" name="source" value={draft.source} onChange={(event) => update("source", event.target.value as LeadSource)} options={LEAD_SOURCES.map((source) => ({ value: source, label: source }))} />
          <TextField label="Source page" name="sourcePage" value={draft.sourcePage} onChange={(event) => update("sourcePage", event.target.value)} placeholder="/courses/bca" />
          <SelectField label="Referred by consultant" name="referredByConsultantId" value={draft.referredByConsultantId ?? ""} onChange={(event) => update("referredByConsultantId", event.target.value || null)} options={consultantOptions} hint="Original attribution; it does not change when the lead is reassigned." />
          <SelectField label="Assigned consultant" name="assignedConsultantId" value={draft.assignedConsultantId ?? ""} onChange={(event) => update("assignedConsultantId", event.target.value || null)} options={consultantOptions} />
          <SelectField label="Lead status" name="status" value={draft.status} onChange={(event) => update("status", event.target.value as Lead["status"])} options={LEAD_STATUSES.map((status) => ({ value: status, label: status }))} />
        </FieldGrid>
        {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}
