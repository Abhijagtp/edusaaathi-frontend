"use client";

import { useState, type FormEvent } from "react";
import type { ConsultantLead } from "@/lib/consultant/types";
import { FormTextarea, PortalButton, PortalDialog } from "./consultant-ui";
import styles from "./consultant.module.css";

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
