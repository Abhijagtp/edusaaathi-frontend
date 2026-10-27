"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate, formatTime } from "@/lib/adminuser/format";
import { getConsultantPhoneHref, getConsultantWhatsAppHref, getMyFollowUps, getMyLeadById } from "@/lib/consultant/mock-service";
import { CONSULTANT_LEAD_STATUSES, type ConsultantFollowUp, type ConsultantLeadStatus } from "@/lib/consultant/types";
import { useConsultantPortal } from "./consultant-provider";
import { AddNoteDialog, FollowUpDialog } from "./consultant-dialogs";
import { EmptyPanel, FollowUpBadge, FormSelect, IconAction, PageHeader, PortalButton, PortalCard, PortalAvatar, StatusBadge } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

export function ConsultantLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const portal = useConsultantPortal();
  const lead = getMyLeadById(portal, id);
  const myFollowUps = useMemo(() => getMyFollowUps(portal).filter((item) => item.leadId === id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)), [portal.followUps, portal.leads, id]);
  const activity = useMemo(() => portal.activities.filter((item) => item.leadId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [portal.activities, id]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<ConsultantFollowUp | undefined>();

  function updateStatus(next: ConsultantLeadStatus) {
    if (!lead || lead.status === next) return;
    if ((next === "Lost" || next === "Converted") && !window.confirm(`Mark ${lead.fullName} as ${next.toLowerCase()}?`)) return;
    portal.updateMyLead(lead.id, { status: next });
  }

  if (!portal.hydrated) return <div className={styles.pageStack}><PageHeader eyebrow="MY LEADS" title="Lead details" description="Loading your assigned student record…" /></div>;
  if (!lead) return <div className={styles.pageStack}><PageHeader eyebrow="MY LEADS" title="Lead not available" description="This record is not assigned to your mock consultant account." back={<Link className={styles.tableLink} href="/consultant/leads">← Back to my leads</Link>} /><EmptyPanel title="No access to this lead" description="Only leads assigned to your account can be opened here. Referral attribution does not grant access to another consultant's contact record." icon="lock" action={<Link className={styles.tableLink} href="/consultant/leads">Return to My Leads</Link>} /></div>;

  const wa = getConsultantWhatsAppHref(lead.phone, lead.fullName, lead.interestedCourse, portal.profile.fullName);
  const phone = getConsultantPhoneHref(lead.phone);

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="ASSIGNED STUDENT RECORD" title={lead.fullName} description={`${lead.interestedCourse} enquiry · Added ${formatDate(lead.createdAt)}`} back={<Link className={styles.tableLink} href="/consultant/leads"><AdminIcon name="chevron-left" size={14} />Back to My Leads</Link>} actions={<>
      {phone ? <Link className={styles.actionButton + " " + styles.actionButtonSecondary} href={phone}><AdminIcon name="phone" size={15} />Call student</Link> : null}
      {wa ? <a className={styles.actionButton + " " + styles.actionButtonSecondary} href={wa} target="_blank" rel="noreferrer" title="Opens your WhatsApp; it does not confirm that a message was sent"><AdminIcon name="whatsapp" size={15} />WhatsApp</a> : null}
    </>} />
    <div className={styles.detailLayout}>
      <div className={styles.detailMainColumn}>
        <PortalCard title="Student information" subtitle="Contact details and enquiry background" action={<StatusBadge status={lead.status} />}>
          <div className={styles.detailInfoGrid}>
            <div className={styles.detailInfoCell}><span>Full name</span><strong>{lead.fullName}</strong></div>
            <div className={styles.detailInfoCell}><span>Interested course</span><strong>{lead.interestedCourse}</strong></div>
            <div className={styles.detailInfoCell}><span>Phone number</span>{phone ? <a href={phone}>{lead.phone}</a> : <strong>{lead.phone}</strong>}</div>
            <div className={styles.detailInfoCell}><span>Email address</span><a href={`mailto:${lead.email}`}>{lead.email}</a></div>
            {lead.educationalBackground ? <div className={styles.detailInfoCell}><span>Educational background</span><strong>{lead.educationalBackground}</strong></div> : null}
            {lead.city ? <div className={styles.detailInfoCell}><span>City / location</span><strong>{lead.city}</strong></div> : null}
            <div className={styles.detailInfoCell}><span>Original enquiry date</span><strong>{formatDate(lead.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}</strong></div>
            <div className={styles.detailInfoCell}><span>Last contacted</span><strong>{lead.lastContactedAt ? formatDate(lead.lastContactedAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Not contacted yet"}</strong></div>
          </div>
        </PortalCard>

        <PortalCard title="Notes" subtitle={`${lead.notes.length} saved note${lead.notes.length === 1 ? "" : "s"}`} action={<PortalButton icon="plus" onClick={() => setNoteOpen(true)}>Add note</PortalButton>}>
          {lead.notes.length ? <div className={styles.noteList}>{lead.notes.map((item) => <article className={styles.noteItem} key={item.id}><p>{item.text}</p><small>{item.author} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></article>)}</div> : <EmptyPanel title="No notes yet" description="Add a short note after your next conversation." icon="note" action={<PortalButton icon="plus" onClick={() => setNoteOpen(true)}>Add first note</PortalButton>} />}
        </PortalCard>

        <PortalCard title="Follow-up history" subtitle="Scheduled touchpoints for this student" action={<PortalButton variant="primary" icon="calendar" onClick={() => setScheduleOpen(true)}>Schedule follow-up</PortalButton>}>
          {myFollowUps.length ? <div className={styles.followupHistory}>{myFollowUps.map((item) => <article className={styles.historyItem} key={item.id}><div><strong>{formatDate(item.scheduledAt, { day: "numeric", month: "short", year: "numeric" })} · {formatTime(item.scheduledAt)}</strong><p>{item.note}</p><small>{item.status === "Completed" ? `Completed ${formatDate(item.completedAt ?? item.scheduledAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : "Pending follow-up"}</small></div><div className={styles.rowActionGroup}>{item.status === "Pending" ? <><IconAction label="Reschedule follow-up" icon="edit" onClick={() => setEditingFollowUp(item)} /><IconAction label="Mark follow-up complete" icon="check" onClick={() => portal.completeFollowUp(item.id)} /></> : <FollowUpBadge completed />}</div></article>)}</div> : <EmptyPanel title="No follow-ups yet" description="Schedule a next conversation so this enquiry stays on track." icon="calendar" action={<PortalButton icon="calendar" onClick={() => setScheduleOpen(true)}>Schedule follow-up</PortalButton>} />}
        </PortalCard>
      </div>

      <aside className={styles.detailSideColumn}>
        <PortalCard title="Quick actions" subtitle="Contact and update this student">
          <div className={styles.quickActions}>
            {phone ? <a href={phone}><AdminIcon name="phone" size={14} />Call student</a> : null}
            {wa ? <a className={styles.quickWhatsApp} href={wa} target="_blank" rel="noreferrer" title="Opens WhatsApp; delivery is not confirmed"><AdminIcon name="whatsapp" size={14} />WhatsApp</a> : null}
            <button type="button" onClick={() => setNoteOpen(true)}><AdminIcon name="note" size={14} />Add note</button>
            <button type="button" onClick={() => setScheduleOpen(true)}><AdminIcon name="calendar" size={14} />Schedule</button>
          </div>
          <p className={styles.attributionNotice}><AdminIcon name="circle-info" size={14} />WhatsApp opens your own account. A click does not mean a message was sent or read.</p>
        </PortalCard>
        <PortalCard title="Lead status" subtitle="Update the current pipeline stage">
          <FormSelect label="Current status" name="lead-status" value={lead.status} onChange={(event) => updateStatus(event.target.value as ConsultantLeadStatus)} options={CONSULTANT_LEAD_STATUSES.map((item) => ({ value: item, label: item }))} />
          <p className={styles.attributionNotice}><AdminIcon name="circle-info" size={14} />Status changes update this browser's demo data only.</p>
        </PortalCard>
        <PortalCard title="Lead attribution" subtitle="Source, original referral and current assignment">
          <div className={styles.attributionStack}>
            <div className={styles.attributionRow}><span>Lead source</span><strong>{lead.source}</strong></div>
            <div className={styles.attributionRow}><span>Referral code</span><strong>{lead.referralCode ?? "—"}</strong></div>
            <div className={styles.attributionRow}><span>Originally referred by</span><strong>{lead.referredByConsultantName ?? "Direct enquiry"}</strong></div>
            <div className={styles.attributionRow}><span>Assigned consultant</span><strong>{portal.profile.fullName}</strong></div>
          </div>
          <p className={styles.attributionNotice}><AdminIcon name="lock" size={14} />Referral owner and attribution are read-only. Assignment does not change who generated the lead.</p>
        </PortalCard>
        <PortalCard title="Activity timeline" subtitle="Updates on this lead record">
          {activity.length ? <div className={styles.timeline}>{activity.map((item) => {
            const icon = item.activityType === "lead-converted" ? "check-circle" : item.activityType.startsWith("follow-up") ? "calendar" : item.activityType === "note-added" ? "note" : item.activityType === "status-updated" ? "sparkle" : "users";
            const title = item.activityType === "lead-converted" ? "Lead converted" : item.activityType === "status-updated" ? "Status updated" : item.activityType === "follow-up-scheduled" ? "Follow-up scheduled" : item.activityType === "follow-up-completed" ? "Follow-up completed" : item.activityType === "note-added" ? "Note added" : "Lead assigned";
            return <div className={styles.timelineItem} key={item.id}><span className={styles.timelineMark}><AdminIcon name={icon} size={13} /></span><div className={styles.timelineContent}><strong>{title}</strong><p>{item.description}</p><small>{item.actorName} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div></div>;
          })}</div> : <EmptyPanel title="No activity recorded" description="Your actions on this lead will appear here." icon="clock" />}
        </PortalCard>
      </aside>
    </div>

    {noteOpen ? <AddNoteDialog lead={lead} onClose={() => setNoteOpen(false)} onSave={(note) => portal.addLeadNote(lead.id, note)} /> : null}
    {scheduleOpen ? <FollowUpDialog leads={portal.leads} initialLeadId={lead.id} onClose={() => setScheduleOpen(false)} onSave={(draft) => portal.createFollowUp(draft)} /> : null}
    {editingFollowUp ? <FollowUpDialog leads={portal.leads} followUp={editingFollowUp} onClose={() => setEditingFollowUp(undefined)} onSave={(draft) => portal.updateFollowUp(editingFollowUp.id, draft)} /> : null}
  </div>;
}
