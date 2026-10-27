"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/adminuser/types";
import { getLeadWhatsAppHref, getReferralUrl, localDateString } from "@/lib/adminuser/mock-data";
import { formatDate, formatTime, percent } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { useAdminSession } from "./admin-session-provider";
import { AdminButton, Avatar, Badge, EmptyState, Modal, PageHeading, Panel, StatCard } from "./admin-ui";
import { FollowUpDialog } from "./follow-up-dialog";
import { HorizontalBars } from "./admin-charts";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

export function ConsultantDashboardPage() {
  const { session, sessionHydrated } = useAdminSession();
  const { leads, consultants, followUps, settings, hydrated, addFollowUp, completeFollowUp } = useAdminData();
  const [copied, setCopied] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [scheduleLeadId, setScheduleLeadId] = useState("");
  const today = localDateString();
  const consultant = session?.role === "consultant" ? consultants.find((item) => item.id === session.consultantId) : undefined;
  const assignedLeads = useMemo(() => consultant ? leads.filter((lead) => lead.assignedConsultantId === consultant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], [leads, consultant]);
  const referredLeads = useMemo(() => consultant ? leads.filter((lead) => lead.referredByConsultantId === consultant.id) : [], [leads, consultant]);
  const ownFollowUps = useMemo(() => consultant ? followUps.filter((item) => item.consultantId === consultant.id).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)) : [], [followUps, consultant]);
  const pendingFollowUps = ownFollowUps.filter((item) => item.status === "Pending");
  const dueFollowUps = pendingFollowUps.filter((item) => item.date <= today).length;
  const converted = assignedLeads.filter((lead) => lead.status === "Converted").length;
  const referralConversions = referredLeads.filter((lead) => lead.status === "Converted").length;
  const referralUrl = consultant ? getReferralUrl(settings.websiteBaseUrl, consultant.referralCode) : "";
  const statuses = ["New", "Contacted", "Follow-up", "Converted", "Lost"] as const;
  const pipeline = statuses.map((status) => ({ label: status, value: assignedLeads.filter((lead) => lead.status === status).length, color: status === "Converted" ? "#16A36A" : status === "Lost" ? "#DC4C4C" : status === "Follow-up" ? "#D97706" : "#5146DC" }));
  const selectedLeadFollowUps = selectedLead ? ownFollowUps.filter((item) => item.leadId === selectedLead.id) : [];

  async function copyReferral() {
    try {
      if (!navigator.clipboard || !referralUrl) return;
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (!sessionHydrated || !hydrated) return <div className={styles.pageContent}><div className={styles.loadingLine}>Loading consultant workspace…</div></div>;
  if (!consultant) return <div className={styles.pageContent}><EmptyState title="Consultant demo account not found" description="Switch to an available consultant account to open this dashboard." icon="users" action={<Link href="/adminuser/login" className={styles.textLink}>Choose demo account <AdminIcon name="arrow-right" size={15} /></Link>} /></div>;

  const openLead = (lead: Lead) => setSelectedLead(lead);
  const openScheduler = (leadId = assignedLeads[0]?.id ?? "") => { setScheduleLeadId(leadId); };

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="CONSULTANT WORKSPACE" title={`Welcome, ${consultant.name.split(" ")[0]}`} description="Your assigned students, follow-up queue and consultant referral activity." actions={<Link href="/adminuser/login" className={styles.switchDemoLink}><AdminIcon name="users-round" size={14} />Switch demo account</Link>} />
    <div className={styles.statsGrid}>
      <StatCard label="My assigned leads" value={assignedLeads.length} helper="Currently assigned to you" icon="users" tone="indigo" />
      <StatCard label="New leads" value={assignedLeads.filter((lead) => lead.status === "New").length} helper="Ready for first contact" icon="sparkle" tone="violet" />
      <StatCard label="Follow-ups due" value={dueFollowUps} helper="Due today or overdue" icon="calendar" tone="amber" />
      <StatCard label="Converted" value={converted} helper={`${percent(converted, assignedLeads.length)} of assigned leads`} icon="check-circle" tone="green" />
      <StatCard label="Referral leads" value={referredLeads.length} helper="Originally attributed to you" icon="referral" tone="blue" />
      <StatCard label="Referral conversions" value={referralConversions} helper={`${percent(referralConversions, referredLeads.length)} of referral leads`} icon="target" tone="rose" />
    </div>

    <div className={styles.consultantDashboardTop}>
      <Panel title="My lead pipeline" subtitle="Current status of assigned students"><HorizontalBars data={pipeline} label="Your assigned leads by status" /></Panel>
      <Panel title="Your referral link" subtitle="Unique consultant link" className={styles.consultantReferralPanel}>
        <div className={styles.consultantReferralIdentity}><Avatar name={consultant.name} size="sm" /><span><strong>{consultant.name}</strong><small>Code · {consultant.referralCode}</small></span></div>
        <div className={styles.consultantReferralLink}><code>{referralUrl}</code><button type="button" aria-label="Copy your referral link" onClick={() => void copyReferral()}><AdminIcon name={copied ? "check" : "copy"} size={15} /></button></div>
        <div className={styles.referralMiniStats}><span><strong>{consultant.referralClicks.toLocaleString("en-IN")}</strong>sample link clicks</span><span><strong>{referredLeads.length}</strong>attributed leads</span><span><strong>{referralConversions}</strong>conversions</span></div>
        <p className={styles.helperInfo}><AdminIcon name="circle-info" size={14} />Clicks are sample counters. Sharing this link does not track real visits.</p>
      </Panel>
    </div>

    <div className={styles.consultantDashboardBottom}>
      <Panel title="My assigned leads" subtitle={`${assignedLeads.length} student records`} action={<AdminButton icon="calendar" onClick={() => openScheduler()} disabled={!assignedLeads.length}>Schedule follow-up</AdminButton>}>
        {assignedLeads.length ? <div className={styles.consultantLeadList}>{assignedLeads.slice(0, 8).map((lead) => { const wa = getLeadWhatsAppHref(lead.phone, lead.studentName, lead.course); return <div className={styles.consultantLeadRow} key={lead.id}><Avatar name={lead.studentName} size="sm" /><button type="button" className={styles.consultantLeadName} onClick={() => openLead(lead)}><strong>{lead.studentName}</strong><small>{lead.course} · {lead.phone}</small></button><Badge dot>{lead.status}</Badge>{wa ? <a className={styles.whatsappAction} href={wa} target="_blank" rel="noreferrer" aria-label={`Open WhatsApp with ${lead.studentName}; this does not confirm delivery`}><AdminIcon name="whatsapp" size={15} /></a> : null}<button type="button" className={styles.iconButton} aria-label={`Schedule follow-up for ${lead.studentName}`} onClick={() => openScheduler(lead.id)}><AdminIcon name="calendar" size={15} /></button></div>; })}</div> : <EmptyState title="No leads assigned yet" description="When leads are assigned to you, they will appear in this list." icon="users" />}
        <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={14} />This consultant view is a frontend demo, not an authorization boundary. WhatsApp links do not confirm delivery.</p>
      </Panel>
      <Panel title="My follow-ups" subtitle={`${pendingFollowUps.length} pending touchpoints`}>
        {pendingFollowUps.length ? <div className={styles.consultantFollowUpList}>{pendingFollowUps.slice(0, 7).map((item) => { const lead = leads.find((entry) => entry.id === item.leadId); const late = item.date < today; return <article className={styles.consultantFollowUpRow} key={item.id}><span className={`${styles.consultantFollowUpDate} ${late ? styles.consultantFollowUpLate : ""}`}><strong>{formatDate(item.date, { day: "numeric" })}</strong><small>{formatDate(item.date, { month: "short" })}</small></span><span className={styles.consultantFollowUpInfo}><button type="button" onClick={() => lead && openLead(lead)}><strong>{lead?.studentName ?? "Lead"}</strong></button><small>{item.notes}</small><small>{formatTime(item.time)} · {late ? "Overdue" : item.date === today ? "Due today" : "Upcoming"}</small></span><AdminButton variant="ghost" className={styles.completeFollowUpButton} icon="check" onClick={() => completeFollowUp(item.id)}>Done</AdminButton></article>; })}</div> : <EmptyState title="No pending follow-ups" description="You are all caught up." icon="calendar" />}
      </Panel>
    </div>

    {selectedLead ? <Modal title={selectedLead.studentName} description={`${selectedLead.course} · ${selectedLead.phone}`} onClose={() => setSelectedLead(undefined)} footer={<><AdminButton onClick={() => setSelectedLead(undefined)}>Close</AdminButton><AdminButton variant="primary" icon="calendar" onClick={() => { openScheduler(selectedLead.id); setSelectedLead(undefined); }}>Schedule follow-up</AdminButton></>}>
      <div className={styles.consultantLeadDetail}><div><span>Status</span><Badge dot>{selectedLead.status}</Badge></div><div><span>Email</span><a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a></div><div><span>Lead source</span><Badge>{selectedLead.source}</Badge></div><div><span>Originally referred by</span><strong>{consultants.find((item) => item.id === selectedLead.referredByConsultantId)?.name ?? "—"}</strong></div><div><span>Created</span><strong>{formatDate(selectedLead.createdAt)}</strong></div></div>
      <Panel title="Lead notes" subtitle={`${selectedLead.notes.length} saved notes`}>
        {selectedLead.notes.length ? <div className={styles.notesList}>{selectedLead.notes.map((note) => <article className={styles.noteCard} key={note.id}><span className={styles.noteIcon}><AdminIcon name="note" size={15} /></span><div><p>{note.text}</p><small>{note.author} · {formatDate(note.createdAt)}</small></div></article>)}</div> : <EmptyState title="No notes yet" description="Admin demo note entry is available from the lead record." icon="note" />}
      </Panel>
      {selectedLeadFollowUps.length ? <div className={styles.consultantDetailFollowups}><strong>Your follow-ups for this student</strong>{selectedLeadFollowUps.map((item) => <span key={item.id}>{formatDate(item.date)} · {formatTime(item.time)} · {item.status}</span>)}</div> : null}
    </Modal> : null}
    {scheduleLeadId ? <FollowUpDialog leadId={scheduleLeadId} leads={assignedLeads} consultants={[consultant]} onClose={() => setScheduleLeadId("")} onSubmit={(draft) => { addFollowUp({ ...draft, consultantId: consultant.id }); setScheduleLeadId(""); }} /> : null}
  </div>;
}
