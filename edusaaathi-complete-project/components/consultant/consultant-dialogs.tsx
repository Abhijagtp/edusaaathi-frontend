"use client";

import { useState, type FormEvent } from "react";
import { consultantLocalDate, consultantLocalTime } from "@/lib/consultant/mock-service";
import type { ConsultantFollowUp, ConsultantFollowUpDraft, ConsultantLead } from "@/lib/consultant/types";
import { FormInput, FormSelect, FormTextarea, PortalButton, PortalDialog } from "./consultant-ui";
import styles from "./consultant.module.css";

export function FollowUpDialog({ leads, followUp, initialLeadId, onClose, onSave }: {
  leads: ConsultantLead[];
  followUp?: ConsultantFollowUp;
  initialLeadId?: string;
  onClose: () => void;
  onSave: (draft: ConsultantFollowUpDraft) => void;
}) {
  const suggestedTime = new Date(Date.now() + 60 * 60 * 1000);
  const [leadId, setLeadId] = useState(followUp?.leadId ?? initialLeadId ?? leads[0]?.id ?? "");
  const [date, setDate] = useState(followUp ? consultantLocalDate(followUp.scheduledAt) : consultantLocalDate(suggestedTime));
  const [time, setTime] = useState(followUp ? consultantLocalTime(followUp.scheduledAt) : consultantLocalTime(suggestedTime));
  const [note, setNote] = useState(followUp?.note ?? "");
  const [error, setError] = useState("");
  const minimumDate = consultantLocalDate(new Date());

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadId) { setError("Choose one of your assigned leads."); return; }
    if (!date || !time || new Date(`${date}T${time}:00`).getTime() <= Date.now()) { setError("Choose a future date and time."); return; }
    if (!note.trim()) { setError("Add a note about the next step."); return; }
    try {
      onSave({ leadId, date, time, note: note.trim() });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The follow-up could not be saved.");
    }
  }

  return <PortalDialog title={followUp ? "Reschedule follow-up" : "Schedule a follow-up"} description="Choose a clear next step for this student. Changes are stored in this browser demo." onClose={onClose} footer={<><PortalButton onClick={onClose}>Cancel</PortalButton><PortalButton variant="primary" type="submit" form="consultant-follow-up-form" icon="calendar">{followUp ? "Save changes" : "Schedule follow-up"}</PortalButton></>}>
    <form id="consultant-follow-up-form" className={styles.formStack} onSubmit={submit}>
      <div className={styles.formGrid}>
        <FormSelect label="Student lead" name="followup-lead" value={leadId} disabled={Boolean(followUp)} onChange={(event) => setLeadId(event.target.value)} required options={leads.map((lead) => ({ value: lead.id, label: `${lead.fullName} · ${lead.interestedCourse}` }))} />
        <FormInput label="Date" name="followup-date" type="date" value={date} min={minimumDate} onChange={(event) => setDate(event.target.value)} required />
        <FormInput label="Time" name="followup-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
      </div>
      <FormTextarea label="Follow-up note" name="followup-note" value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={500} required placeholder="What will you discuss or send?" />
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
    </form>
  </PortalDialog>;
}

export function AddNoteDialog({ lead, onClose, onSave }: { lead: ConsultantLead; onClose: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) { setError("Enter a note before saving."); return; }
    try {
      onSave(note.trim());
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The note could not be saved.");
    }
  }

  return <PortalDialog title={`Add a note for ${lead.fullName}`} description="Keep useful context from your conversation in the student's lead record." onClose={onClose} footer={<><PortalButton onClick={onClose}>Cancel</PortalButton><PortalButton variant="primary" type="submit" form="consultant-note-form" icon="note">Save note</PortalButton></>}>
    <form id="consultant-note-form" className={styles.formStack} onSubmit={submit}>
      <FormTextarea label="Note" name="lead-note" value={note} onChange={(event) => setNote(event.target.value)} rows={5} maxLength={1200} required placeholder="Add a concise, helpful note…" />
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
    </form>
  </PortalDialog>;
}
