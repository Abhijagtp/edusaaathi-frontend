"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/adminuser/format";
import { getConsultantWhatsAppHref, getMyDashboard } from "@/lib/consultant/mock-service";
import { useConsultantPortal } from "./consultant-provider";
import { EmptyPanel, IconAction, MetricCard, PageHeader, PortalCard, PortalAvatar, StatusBadge } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

const pipelineColors: Record<string, string> = {
  New: "#5a50d1", Contacted: "#3883b5", "In progress": "#d18620", Converted: "#258151", Lost: "#b64c4c",
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Try the local fallback
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  try {
    input.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
  }
}

export function ConsultantDashboardPage() {
  const portal = useConsultantPortal();
  const dashboard = useMemo(() => getMyDashboard(portal), [portal.profile, portal.leads, portal.referralLeads, portal.activities]);

  // Extract recent student notes from assigned leads
  const recentNotes = useMemo(() => {
    return portal.leads
      .filter((lead) => lead.assignedConsultantId === portal.profile.id)
      .flatMap((lead) => (lead.notes || []).map((n) => ({ ...n, leadId: lead.id, studentName: lead.fullName, course: lead.interestedCourse })))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [portal.leads, portal.profile.id]);

  async function copyReferral() {
    const ok = await copyText(dashboard.referralStats.referralUrl);
    portal.announce(ok ? "Referral link copied. Share it so students can submit an enquiry." : "Could not copy automatically. Select and copy the referral link from the Referral page.");
  }

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="CONSULTANT OVERVIEW" title={`Welcome back, ${portal.profile.fullName.split(" ")[0]}`} description="Your assigned student enquiries, counseling notes and personal referral results." actions={<Link className={styles.actionButton + " " + styles.actionButtonPrimary} href="/consultant/leads"><AdminIcon name="users" size={15} />Open my leads</Link>} />
    {!portal.hydrated ? <PortalCard title="Loading your workspace"><p className={styles.tableMuted}>Opening your browser-local consultant data…</p></PortalCard> : <>
      <section className={styles.metricGrid} aria-label="Personal consultant performance summary">
        <MetricCard label="Total assigned leads" value={dashboard.totalAssigned} note="Currently in your queue" icon="users" />
        <MetricCard label="New leads" value={dashboard.newLeads} note="Awaiting first contact" icon="sparkle" tone="purple" />
        <MetricCard label="Counselor notes" value={dashboard.notesLogged} note="Total interaction notes logged" icon="note" tone="amber" />
        <MetricCard label="Converted leads" value={dashboard.converted} note="From your assigned queue" icon="check-circle" tone="green" />
        <MetricCard label="Referral leads" value={dashboard.referralLeads} note="Enquiries attributed to you" icon="link" tone="blue" />
        <MetricCard label="Conversion rate" value={`${dashboard.conversionRate}%`} note="Converted ÷ assigned leads" icon="target" tone="rose" />
      </section>

      <div className={styles.dashboardGrid}>
        <PortalCard title="My lead pipeline" subtitle={`${dashboard.totalAssigned} assigned student enquiries by current status`}>
          {dashboard.totalAssigned ? <>
            <div className={styles.pipelineList} role="list" aria-label="Assigned lead counts by status">
              {dashboard.pipeline.map((item) => <div className={styles.pipelineItem} role="listitem" key={item.status}><span>{item.status}</span><span className={styles.pipelineTrack}><i style={{ width: `${dashboard.totalAssigned ? (item.count / dashboard.totalAssigned) * 100 : 0}%`, background: pipelineColors[item.status] }} /></span><strong>{item.count}</strong></div>)}
            </div>
            <p className={styles.pipelineFoot}>Pipeline shows leads currently assigned to you; referral attribution is counted separately.</p>
          </> : <EmptyPanel title="No assigned leads yet" description="New enquiries assigned to your account will appear here." icon="users" />}
        </PortalCard>

        <PortalCard title="My referral performance" subtitle="Lead attribution from submitted enquiries" action={<Link className={styles.sectionLink} href="/consultant/referrals">View referral page <AdminIcon name="arrow-right" size={13} /></Link>}>
          <div className={styles.referralSummaryCard}>
            <div className={styles.referralSummaryTop}><PortalAvatar name={portal.profile.fullName} size="sm" /><div><strong>{portal.profile.fullName}</strong><small>Personal code · {portal.profile.referralCode}</small></div></div>
            <div className={styles.referralUrlRow}><code>{dashboard.referralStats.referralUrl}</code><IconAction label="Copy referral link" icon="copy" onClick={() => void copyReferral()} /></div>
            <div className={styles.referralStatStrip}>
              <span><strong>{dashboard.referralStats.total}</strong>referral leads</span>
              <span><strong>{dashboard.referralStats.converted}</strong>converted</span>
              <span><strong>{dashboard.referralStats.conversionRate}%</strong>conversion</span>
            </div>
          </div>
          <p className={styles.attributionNotice}><AdminIcon name="circle-info" size={14} />Only submitted enquiries count as captured referrals. Link clicks are not tracked in this mock.</p>
        </PortalCard>
      </div>

      <div className={styles.dashboardBottom}>
        <PortalCard title="Recent leads" subtitle="Recently updated records assigned to you" action={<Link className={styles.sectionLink} href="/consultant/leads">View all leads <AdminIcon name="arrow-right" size={13} /></Link>}>
          {dashboard.recentLeads.length ? <div className={styles.tableViewport}><table className={styles.dataTable}>
            <caption className={styles.srOnly}>Recent leads assigned to you</caption>
            <thead><tr><th scope="col">Student</th><th scope="col">Interested course</th><th scope="col">Source</th><th scope="col">Status</th><th scope="col">Notes</th><th scope="col">Action</th></tr></thead>
            <tbody>{dashboard.recentLeads.slice(0, 7).map((lead) => {
              const wa = getConsultantWhatsAppHref(lead.phone, lead.fullName, lead.interestedCourse, portal.profile.fullName);
              return <tr key={lead.id}>
                <td><div className={styles.personCell}><PortalAvatar name={lead.fullName} size="sm" /><span><strong>{lead.fullName}</strong><small>{lead.phone}</small></span></div></td>
                <td>{lead.interestedCourse}</td><td><span className={styles.tableMainText}>{lead.source}</span></td><td><StatusBadge status={lead.status} /></td>
                <td><span className={styles.tableMainText}>{lead.notes?.length ? `${lead.notes.length} note(s)` : "—"}</span></td>
                <td><div className={styles.rowActionGroup}><IconAction label={`View ${lead.fullName}`} icon="eye" href={`/consultant/leads/${lead.id}`} />{wa ? <IconAction label={`Open WhatsApp with ${lead.fullName}; delivery is not confirmed`} icon="whatsapp" href={wa} target="_blank" tone="whatsapp" /> : null}</div></td>
              </tr>;
            })}</tbody>
          </table></div> : <EmptyPanel title="No recent leads" description="Your assigned students will appear here as soon as they are added." icon="users" />}
        </PortalCard>

        <PortalCard title="Recent Student Notes" subtitle="Latest counselor interactions logged" action={<Link className={styles.sectionLink} href="/consultant/leads">View my leads <AdminIcon name="arrow-right" size={13} /></Link>}>
          {recentNotes.length ? <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{recentNotes.map((item) => (
            <Link href={`/consultant/leads/${item.leadId}`} key={item.id} style={{ textDecoration: "none", color: "inherit", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 13, color: "#0f172a" }}>{item.studentName}</strong>
                <span style={{ fontSize: 11, color: "#64748b" }}>{item.course}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.text}</p>
              <small style={{ fontSize: 11, color: "#94a3b8" }}>{item.author} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>
            </Link>
          ))}</div> : <EmptyPanel title="No student notes yet" description="Add notes to any assigned lead to keep conversation context." icon="note" />}
        </PortalCard>
      </div>

      <PortalCard title="Recent activity" subtitle="Recent updates on records assigned to you" action={<span className={styles.tableCount}>{dashboard.recentActivities.length} latest</span>}>
        {dashboard.recentActivities.length ? <div className={styles.activityList}>{dashboard.recentActivities.map((item) => {
          const Icon = item.activityType === "lead-converted" ? "check-circle" : item.activityType === "note-added" ? "note" : item.activityType === "status-updated" ? "sparkle" : "users";
          const lead = portal.leads.find((entry) => entry.id === item.leadId);
          return <div className={styles.activityRow} key={item.id}>
            <span className={`${styles.activityMark} ${item.activityType === "lead-converted" ? styles.activityMarkSuccess : ""}`}><AdminIcon name={Icon} size={14} /></span>
            <div><strong>{item.activityType === "lead-converted" ? "Lead converted" : item.activityType === "status-updated" ? "Lead status updated" : item.activityType === "note-added" ? "Note added" : "Lead assigned"}</strong><p>{item.description}{lead ? ` · ${lead.fullName}` : ""}</p><small>{item.actorName} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div>
          </div>;
        })}</div> : <EmptyPanel title="No recent activity" description="Your lead updates and completed actions will appear here." icon="clock" />}
      </PortalCard>
    </>}
  </div>;
}
