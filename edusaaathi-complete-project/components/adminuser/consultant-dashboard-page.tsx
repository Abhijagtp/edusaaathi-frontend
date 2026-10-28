"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/adminuser/types";
import { getLeadWhatsAppHref, getReferralUrl } from "@/lib/adminuser/mock-data";
import { formatDate, percent } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { useAdminSession } from "./admin-session-provider";
import { AdminButton, Avatar, Badge, EmptyState, Modal, PageHeading, Panel, StatCard } from "./admin-ui";
import { HorizontalBars } from "./admin-charts";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

export function ConsultantDashboardPage() {
  const { session, sessionHydrated } = useAdminSession();
  const { leads, consultants, settings, hydrated, addLeadNote } = useAdminData();
  const [copied, setCopied] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>();
  const [noteLead, setNoteLead] = useState<Lead | undefined>();
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const consultant = session?.role === "consultant" ? consultants.find((item) => item.id === session.consultantId) : undefined;
  const assignedLeads = useMemo(() => consultant ? leads.filter((lead) => lead.assignedConsultantId === consultant.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], [leads, consultant]);
  const referredLeads = useMemo(() => consultant ? leads.filter((lead) => lead.referredByConsultantId === consultant.id) : [], [leads, consultant]);
  const totalNotes = assignedLeads.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0);
  const converted = assignedLeads.filter((lead) => lead.status === "Converted").length;
  const referralConversions = referredLeads.filter((lead) => lead.status === "Converted").length;
  const referralUrl = consultant ? getReferralUrl(settings.websiteBaseUrl, consultant.referralCode) : "";
  const statuses = ["New", "Contacted", "In progress", "Converted", "Lost"] as const;
  const pipeline = statuses.map((status) => ({
    label: status,
    value: assignedLeads.filter((lead) => lead.status === status).length,
    color: status === "Converted" ? "#16A36A" : status === "Lost" ? "#DC4C4C" : status === "In progress" ? "#D97706" : "#5146DC"
  }));

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

  async function handleAddNote() {
    if (!noteLead || !noteInput.trim()) return;
    setSavingNote(true);
    await addLeadNote(noteLead.id, noteInput.trim());
    setSavingNote(false);
    setNoteInput("");
    setNoteLead(undefined);
  }

  if (!sessionHydrated || !hydrated) return <div className={styles.pageContent}><div className={styles.loadingLine}>Loading consultant workspace…</div></div>;
  if (!consultant) return <div className={styles.pageContent}><EmptyState title="Consultant workspace" description="Sign in with your consultant account to open this workspace." icon="users" action={<Link href="/adminuser/login" className={styles.textLink}>Sign in <AdminIcon name="arrow-right" size={15} /></Link>} /></div>;

  const openLead = (lead: Lead) => setSelectedLead(lead);

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="CONSULTANT WORKSPACE" title={`Welcome, ${consultant.name.split(" ")[0]}`} description="Your assigned students, notes queue and consultant referral activity." />
    <div className={styles.statsGrid}>
      <StatCard label="My assigned leads" value={assignedLeads.length} helper="Currently assigned to you" icon="users" tone="indigo" />
      <StatCard label="New leads" value={assignedLeads.filter((lead) => lead.status === "New").length} helper="Ready for first contact" icon="sparkle" tone="violet" />
      <StatCard label="Counselor notes" value={totalNotes} helper="Logged on your students" icon="file-text" tone="amber" />
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
      <Panel title="My assigned leads" subtitle={`${assignedLeads.length} student records`}>
        {assignedLeads.length ? <div className={styles.consultantLeadList}>{assignedLeads.slice(0, 8).map((lead) => {
          const wa = getLeadWhatsAppHref(lead.phone, lead.studentName, lead.course);
          return <div className={styles.consultantLeadRow} key={lead.id}>
            <Avatar name={lead.studentName} size="sm" />
            <button type="button" className={styles.consultantLeadName} onClick={() => openLead(lead)}>
              <strong>{lead.studentName}</strong>
              <small>{lead.course} · {lead.phone}</small>
            </button>
            <Badge dot>{lead.status}</Badge>
            {wa ? <a className={styles.whatsappAction} href={wa} target="_blank" rel="noreferrer" aria-label={`Open WhatsApp with ${lead.studentName}`}><AdminIcon name="whatsapp" size={15} /></a> : null}
            <button type="button" className={styles.iconButton} aria-label={`Add note for ${lead.studentName}`} title="Add note" onClick={() => setNoteLead(lead)}>
              <AdminIcon name="file-text" size={15} />
            </button>
          </div>;
        })}</div> : <EmptyState title="No leads assigned yet" description="When leads are assigned to you, they will appear in this list." icon="users" />}
      </Panel>
      <Panel title="Recent student notes" subtitle={`${totalNotes} notes recorded`}>
        {totalNotes > 0 ? <div className={styles.consultantFollowUpList}>
          {assignedLeads.flatMap((lead) => (lead.notes || []).map((note) => ({ ...note, studentName: lead.studentName, leadId: lead.id })))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 7)
            .map((note) => (
              <article className={styles.consultantFollowUpRow} key={note.id}>
                <span className={styles.consultantFollowUpInfo}>
                  <strong>{note.studentName}</strong>
                  <small>{note.text}</small>
                  <small>{note.author} · {formatDate(note.createdAt)}</small>
                </span>
              </article>
            ))}
        </div> : <EmptyState title="No notes recorded yet" description="Add notes to your assigned leads to keep track of conversations." icon="note" />}
      </Panel>
    </div>

    {selectedLead ? <Modal title={selectedLead.studentName} description={`${selectedLead.course} · ${selectedLead.phone}`} onClose={() => setSelectedLead(undefined)} footer={<AdminButton onClick={() => setSelectedLead(undefined)}>Close</AdminButton>}>
      <div className={styles.consultantLeadDetail}><div><span>Status</span><Badge dot>{selectedLead.status}</Badge></div><div><span>Email</span><a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a></div><div><span>Lead source</span><Badge>{selectedLead.source}</Badge></div><div><span>Originally referred by</span><strong>{consultants.find((item) => item.id === selectedLead.referredByConsultantId)?.name ?? "—"}</strong></div><div><span>Created</span><strong>{formatDate(selectedLead.createdAt)}</strong></div></div>
      <Panel title="Lead notes" subtitle={`${selectedLead.notes.length} saved notes`} action={<AdminButton icon="plus" onClick={() => { setNoteLead(selectedLead); }}>Add note</AdminButton>}>
        {selectedLead.notes.length ? <div className={styles.notesList}>{selectedLead.notes.map((note) => <article className={styles.noteCard} key={note.id}><span className={styles.noteIcon}><AdminIcon name="note" size={15} /></span><div><p>{note.text}</p><small>{note.author} · {formatDate(note.createdAt)}</small></div></article>)}</div> : <EmptyState title="No notes yet" description="Add notes to log your counseling conversations." icon="note" />}
      </Panel>
    </Modal> : null}

    {noteLead ? <Modal title={`Add note for ${noteLead.studentName}`} description={`${noteLead.course} · ${noteLead.phone}`} onClose={() => { setNoteLead(undefined); setNoteInput(""); }} footer={<>
      <AdminButton onClick={() => { setNoteLead(undefined); setNoteInput(""); }}>Cancel</AdminButton>
      <AdminButton variant="primary" icon="check" disabled={savingNote} onClick={handleAddNote}>{savingNote ? "Saving…" : "Save note"}</AdminButton>
    </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>Record counseling details, requirements, next steps, or student feedback.</p>
        <textarea
          rows={4}
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="e.g., Student asked for fee breakdown and syllabus. Discussed batch timing..."
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.9rem", resize: "vertical" }}
          autoFocus
        />
      </div>
    </Modal> : null}
  </div>;
}
