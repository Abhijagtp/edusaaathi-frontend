"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getConsultantName, getLeadWhatsAppHref } from "@/lib/adminuser/mock-data";
import type { Lead } from "@/lib/adminuser/types";
import { formatDate, formatTime } from "@/lib/adminuser/format";
import { LEAD_STATUSES } from "@/lib/adminuser/mock-data";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, Avatar, Badge, EmptyState, Modal, PageHeading, Panel, SelectField, TextAreaField } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import { LeadDialog } from "./lead-dialog";
import { FollowUpDialog } from "./follow-up-dialog";
import styles from "./admin.module.css";

export function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const leadId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { leads, consultants, followUps, activities, hydrated, setLeadStatus, assignLeads, updateLead, addLeadNote, addFollowUp } = useAdminData();
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [note, setNote] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const lead = leads.find((item) => item.id === leadId);
  const leadFollowUps = useMemo(() => followUps.filter((item) => item.leadId === leadId).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)), [followUps, leadId]);
  const leadActivities = useMemo(() => activities.filter((item) => item.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [activities, leadId]);
  const nextFollowUp = leadFollowUps.find((item) => item.status === "Pending");

  if (!hydrated) return <div className={styles.pageContent}><div className={styles.loadingLine}>Loading lead details…</div></div>;
  if (!lead) return <div className={styles.pageContent}><PageHeading eyebrow="LEAD RECORD" title="Lead not found" description="This lead may have been removed from the local demo data." actions={<Link href="/adminuser/leads" className={styles.textLink}><AdminIcon name="arrow-right" size={15} />Back to leads</Link>} /><EmptyState title="No matching lead" description="Return to All Leads to select another record." icon="users" /></div>;

  const whatsappHref = getLeadWhatsAppHref(lead.phone, lead.studentName, lead.course);
  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim() || !lead) return;
    addLeadNote(lead.id, note);
    setNote("");
    setNoteOpen(false);
  }

  return (
    <div className={styles.pageContent}>
      <PageHeading eyebrow="LEAD RECORD" title={lead.studentName} description={`${lead.course} · Created ${formatDate(lead.createdAt)}`} back={<Link href="/adminuser/leads" className={styles.backLink}><AdminIcon name="chevron-left" size={15} />All leads</Link>} actions={<>
        {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className={styles.whatsappButton} title="Opens WhatsApp; it does not confirm delivery"><AdminIcon name="whatsapp" size={16} />WhatsApp</a> : null}
        <AdminButton icon="edit" onClick={() => setEditOpen(true)}>Edit lead</AdminButton>
      </>} />

      <div className={styles.detailGrid}>
        <div className={styles.detailMain}>
          <Panel title="Student information" subtitle="Contact details and enquiry context" action={<Badge dot>{lead.status}</Badge>}>
            <div className={styles.detailInfoGrid}>
              <div className={styles.detailInfoItem}><span>Student name</span><strong>{lead.studentName}</strong></div>
              <div className={styles.detailInfoItem}><span>Interested course</span><strong>{lead.course}</strong></div>
              <div className={styles.detailInfoItem}><span>Phone</span><a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}><AdminIcon name="phone" size={14} />{lead.phone}</a></div>
              <div className={styles.detailInfoItem}><span>Email</span><a href={`mailto:${lead.email}`}><AdminIcon name="mail" size={14} />{lead.email}</a></div>
              <div className={styles.detailInfoItem}><span>Lead source</span><Badge>{lead.source}</Badge></div>
              <div className={styles.detailInfoItem}><span>Source page</span><strong>{lead.sourcePage || "—"}</strong></div>
              <div className={styles.detailInfoItem}><span>Originally referred by</span><div className={styles.peopleInline}><Avatar name={getConsultantName(consultants, lead.referredByConsultantId)} size="xs" /><strong>{getConsultantName(consultants, lead.referredByConsultantId)}</strong></div></div>
              <div className={styles.detailInfoItem}><span>Currently assigned to</span><div className={styles.peopleInline}><Avatar name={getConsultantName(consultants, lead.assignedConsultantId)} size="xs" /><strong>{getConsultantName(consultants, lead.assignedConsultantId)}</strong></div></div>
              <div className={styles.detailInfoItem}><span>Last contacted</span><strong>{lead.lastContactedAt ? formatDate(lead.lastContactedAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Not contacted yet"}</strong></div>
              <div className={styles.detailInfoItem}><span>Enquiry date</span><strong>{formatDate(lead.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</strong></div>
            </div>
          </Panel>

          <Panel title="Notes" subtitle={`${lead.notes.length} note${lead.notes.length === 1 ? "" : "s"}`} action={<AdminButton icon="plus" onClick={() => setNoteOpen(true)}>Add note</AdminButton>}>
            {lead.notes.length ? <div className={styles.notesList}>{lead.notes.map((item) => <article className={styles.noteCard} key={item.id}><span className={styles.noteIcon}><AdminIcon name="note" size={16} /></span><div><p>{item.text}</p><small>{item.author} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div></article>)}</div> : <EmptyState title="No notes yet" description="Add context from calls and conversations." icon="note" action={<AdminButton onClick={() => setNoteOpen(true)} icon="plus">Add first note</AdminButton>} />}
          </Panel>

          <Panel title="Activity timeline" subtitle="Changes and conversations on this lead">
            {leadActivities.length ? <div className={styles.activityTimeline}>{leadActivities.map((item) => <div className={styles.activityItem} key={item.id}><span className={styles.activityTimelineDot}><AdminIcon name={item.type === "note-added" ? "note" : item.type === "follow-up" ? "calendar" : item.type === "status-changed" ? "check-circle" : "users"} size={14} /></span><div><strong>{item.title}</strong><p>{item.description}</p><small>{item.actor} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div></div>)}</div> : <EmptyState title="No activity yet" description="Lead updates will appear in this timeline." icon="clock" />}
          </Panel>

          <Panel title="Follow-up history" subtitle="Scheduled and completed touchpoints" action={<AdminButton icon="plus" onClick={() => setFollowUpOpen(true)}>Schedule</AdminButton>}>
            {leadFollowUps.length ? <div className={styles.followUpHistory}>{leadFollowUps.map((item) => <article key={item.id}><span className={`${styles.historyMarker} ${item.status === "Completed" ? styles.historyMarkerDone : ""}`}><AdminIcon name={item.status === "Completed" ? "check" : "calendar"} size={14} /></span><div className={styles.historyBody}><div><strong>{formatDate(item.date, { day: "numeric", month: "short", year: "numeric" })} · {formatTime(item.time)}</strong><Badge>{item.status}</Badge></div><p>{item.notes}</p><small>{getConsultantName(consultants, item.consultantId)}{item.completedAt ? ` · Completed ${formatDate(item.completedAt)}` : ""}</small></div></article>)}</div> : <EmptyState title="No follow-ups scheduled" description="Schedule a date and time for the next conversation." icon="calendar" action={<AdminButton icon="plus" onClick={() => setFollowUpOpen(true)}>Schedule follow-up</AdminButton>} />}
          </Panel>
        </div>

        <aside className={styles.detailSide}>
          <Panel title="Lead status" subtitle="Update the current pipeline stage">
            <SelectField label="Current status" name="lead-status" value={lead.status} onChange={(event) => setLeadStatus(lead.id, event.target.value as Lead["status"])} options={LEAD_STATUSES.map((status) => ({ value: status, label: status }))} />
            <div className={styles.statusHelp}><AdminIcon name="circle-info" size={15} />Changes are saved in the local mock data.</div>
          </Panel>
          <Panel title="Assignment" subtitle="Current owner and original attribution">
            <div className={styles.assignmentPerson}><Avatar name={getConsultantName(consultants, lead.assignedConsultantId)} size="md" /><span><strong>{getConsultantName(consultants, lead.assignedConsultantId)}</strong><small>Assigned consultant</small></span></div>
            <SelectField label="Reassign to" name="reassign" value={selectedAssignee || lead.assignedConsultantId || ""} onChange={(event) => setSelectedAssignee(event.target.value)} options={[{ value: "", label: "Select consultant" }, { value: "__unassigned", label: "Unassign" }, ...consultants.filter((person) => person.status === "Active").map((person) => ({ value: person.id, label: person.name }))]} />
            <AdminButton variant="primary" icon="users" className={styles.fullWidthButton} disabled={!selectedAssignee || (selectedAssignee === "__unassigned" ? !lead.assignedConsultantId : selectedAssignee === lead.assignedConsultantId)} onClick={() => { assignLeads([lead.id], selectedAssignee === "__unassigned" ? null : selectedAssignee); setSelectedAssignee(""); }}>Reassign lead</AdminButton>
            <div className={styles.referralAttribution}><span>Original referral</span><strong>{getConsultantName(consultants, lead.referredByConsultantId)}</strong><small>Reassignment does not change this attribution.</small></div>
          </Panel>
          <Panel title="Next follow-up" subtitle="Upcoming contact plan">
            {nextFollowUp ? <div className={styles.nextFollowUp}><div className={styles.nextFollowDate}><AdminIcon name="calendar-days" size={17} /><span><strong>{formatDate(nextFollowUp.date, { day: "numeric", month: "long" })}</strong><small>{formatTime(nextFollowUp.time)}</small></span></div><p>{nextFollowUp.notes}</p><small>Assigned to {getConsultantName(consultants, nextFollowUp.consultantId)}</small><AdminButton className={styles.fullWidthButton} onClick={() => setFollowUpOpen(true)} icon="calendar">Reschedule</AdminButton></div> : <div className={styles.noNextFollowUp}><p>No pending follow-up.</p><AdminButton icon="plus" onClick={() => setFollowUpOpen(true)}>Schedule one</AdminButton></div>}
          </Panel>
        </aside>
      </div>

      {editOpen ? <LeadDialog lead={lead} consultants={consultants} onClose={() => setEditOpen(false)} onSubmit={(draft) => { if (draft.id) updateLead(draft.id, draft); setEditOpen(false); }} /> : null}
      {followUpOpen ? <FollowUpDialog leadId={lead.id} leads={leads} consultants={consultants} onClose={() => setFollowUpOpen(false)} onSubmit={(draft) => { addFollowUp(draft); setFollowUpOpen(false); }} /> : null}
      {noteOpen ? <Modal title="Add a lead note" description={`Record a useful detail from your conversation with ${lead.studentName}.`} onClose={() => setNoteOpen(false)} footer={<><AdminButton onClick={() => setNoteOpen(false)}>Cancel</AdminButton><AdminButton variant="primary" type="submit" form="lead-note-form" icon="note">Save note</AdminButton></>}><form id="lead-note-form" onSubmit={saveNote} className={styles.formStack}><TextAreaField label="Note" name="note" rows={5} value={note} onChange={(event) => setNote(event.target.value)} required placeholder="Write a concise, helpful note…" /><p className={styles.helperInfo}><AdminIcon name="circle-info" size={14} />This note is visible in the local prototype only.</p></form></Modal> : null}
    </div>
  );
}
