"use client";

import { useState, type FormEvent } from "react";
import type { Consultant, FollowUp, FollowUpDraft, Lead } from "@/lib/adminuser/types";
import { dateOffset } from "@/lib/adminuser/mock-data";
import { AdminButton, FieldGrid, Modal, SelectField, TextAreaField, TextField } from "./admin-ui";
import styles from "./admin.module.css";

export function FollowUpDialog({ followUp, leads, consultants, leadId, onClose, onSubmit }: { followUp?: FollowUp; leads: Lead[]; consultants: Consultant[]; leadId?: string; onClose: () => void; onSubmit: (draft: FollowUpDraft) => void }) {
  const [draft, setDraft] = useState<FollowUpDraft>(() => ({
    id: followUp?.id,
    leadId: followUp?.leadId ?? leadId ?? leads[0]?.id ?? "",
    consultantId: followUp?.consultantId ?? (followUp?.leadId ? leads.find((lead) => lead.id === followUp.leadId)?.assignedConsultantId ?? null : null),
    date: followUp?.date ?? dateOffset(1),
    time: followUp?.time ?? "11:00",
    notes: followUp?.notes ?? "",
  }));
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.leadId) { setError("Choose a student lead first."); return; }
    setError("");
    onSubmit(draft);
  }

  return (
    <Modal title={followUp ? "Reschedule follow-up" : "Schedule follow-up"} description="Set a clear date, time and next step for the student conversation." onClose={onClose} footer={<><AdminButton onClick={onClose}>Cancel</AdminButton><AdminButton variant="primary" type="submit" form="follow-up-editor">{followUp ? "Save schedule" : "Schedule follow-up"}</AdminButton></>}>
      <form id="follow-up-editor" onSubmit={submit} className={styles.formStack}>
        <FieldGrid>
          <SelectField label="Student lead" name="leadId" value={draft.leadId} onChange={(event) => setDraft((current) => ({ ...current, leadId: event.target.value, consultantId: leads.find((lead) => lead.id === event.target.value)?.assignedConsultantId ?? null }))} required options={[{ value: "", label: "Select a lead" }, ...leads.map((lead) => ({ value: lead.id, label: `${lead.studentName} · ${lead.course}` }))]} />
          <SelectField label="Assigned consultant" name="consultantId" value={draft.consultantId ?? ""} onChange={(event) => setDraft((current) => ({ ...current, consultantId: event.target.value || null }))} options={[{ value: "", label: "Unassigned" }, ...consultants.map((consultant) => ({ value: consultant.id, label: consultant.name }))]} />
          <TextField label="Date" name="date" type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} required />
          <TextField label="Time" name="time" type="time" value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} required />
        </FieldGrid>
        <TextAreaField label="Follow-up notes" name="notes" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} required placeholder="What should happen during this follow-up?" />
        {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}
