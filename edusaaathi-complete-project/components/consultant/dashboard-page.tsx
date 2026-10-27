"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/adminuser/format";
import { getConsultantWhatsAppHref, getMyDashboard } from "@/lib/consultant/mock-service";
import { useConsultantPortal } from "./consultant-provider";
import { EmptyPanel, IconAction, MetricCard, PageHeader, PortalCard, PortalAvatar, StatusBadge } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

const pipelineColors: Record<string, string> = {
  New: "#5a50d1", Contacted: "#3883b5", "Follow-up": "#d18620", Converted: "#258151", Lost: "#b64c4c",
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Try the local fallback for browsers without clipboard permission.
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
  const dashboard = useMemo(() => getMyDashboard(portal), [portal.profile, portal.leads, portal.referralLeads, portal.followUps, portal.activities]);

  async function copyReferral() {
    const ok = await copyText(dashboard.referralStats.referralUrl);
    portal.announce(ok ? "Referral link copied. Share it so students can submit an enquiry." : "Could not copy automatically. Select and copy the referral link from the Referral page.");
  }

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="CONSULTANT OVERVIEW" title={`Welcome back, ${portal.profile.fullName.split(" ")[0]}`} description="Your assigned student enquiries, today's follow-ups and personal referral results." actions={<Link className={styles.actionButton + " " + styles.actionButtonPrimary} href="/consultant/leads"><AdminIcon name="users" size={15} />Open my leads</Link>} />
    {!portal.hydrated ? <PortalCard title="Loading your workspace"><p className={styles.tableMuted}>Opening your browser-local consultant data…</p></PortalCard> : <>
      <section className={styles.metricGrid} aria-label="Personal consultant performance summary">
        <MetricCard label="Total assigned leads" value={dashboard.totalAssigned} note="Currently in your queue" icon="users" />
        <MetricCard label="New leads" value={dashboard.newLeads} note="Awaiting first contact" icon="sparkle" tone="purple" />
        <MetricCard label="Follow-ups due" value={dashboard.followUpsDue} note="Today or overdue" icon="calendar" tone={dashboard.followUpsDue ? "amber" : "green"} />
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
            <thead><tr><th scope="col">Student</th><th scope="col">Interested course</th><th scope="col">Source</th><th scope="col">Status</th><th scope="col">Next follow-up</th><th scope="col">Action</th></tr></thead>
            <tbody>{dashboard.recentLeads.slice(0, 7).map((lead) => {
              const next = lead.nextFollowUpAt;
              const wa = getConsultantWhatsAppHref(lead.phone, lead.fullName, lead.interestedCourse, portal.profile.fullName);
              return <tr key={lead.id}>
                <td><div className={styles.personCell}><PortalAvatar name={lead.fullName} size="sm" /><span><strong>{lead.fullName}</strong><small>{lead.phone}</small></span></div></td>
                <td>{lead.interestedCourse}</td><td><span className={styles.tableMainText}>{lead.source}</span></td><td><StatusBadge status={lead.status} /></td>
                <td>{next ? <span className={styles.tableMainText}>{formatDate(next, { day: "numeric", month: "short" })} · {formatTime(next)}</span> : <span className={styles.tableMuted}>Not scheduled</span>}</td>
                <td><div className={styles.rowActionGroup}><IconAction label={`View ${lead.fullName}`} icon="eye" href={`/consultant/leads/${lead.id}`} />{wa ? <IconAction label={`Open WhatsApp with ${lead.fullName}; delivery is not confirmed`} icon="whatsapp" href={wa} target="_blank" tone="whatsapp" /> : null}</div></td>
              </tr>;
            })}</tbody>
          </table></div> : <EmptyPanel title="No recent leads" description="Your assigned students will appear here as soon as they are added." icon="users" />}
        </PortalCard>

        <PortalCard title="Today's follow-ups" subtitle={`${dashboard.todayFollowUps.length} scheduled today`} action={<Link className={styles.sectionLink} href="/consultant/follow-ups">Manage follow-ups <AdminIcon name="arrow-right" size={13} /></Link>}>
          {dashboard.todayFollowUps.length ? <div className={styles.followupQueue}>{dashboard.todayFollowUps.map((item) => {
            const lead = portal.leads.find((entry) => entry.id === item.leadId);
            if (!lead) return null;
            const wa = getConsultantWhatsAppHref(lead.phone, lead.fullName, lead.interestedCourse, portal.profile.fullName);
            return <article className={styles.followupQueueItem} key={item.id}>
              <span className={styles.followupDateTile}><strong>{formatTime(item.scheduledAt).replace(/\s/g, "")}</strong><small>Today</small></span>
              <span className={styles.followupQueueInfo}><Link href={`/consultant/leads/${lead.id}`}>{lead.fullName}</Link><small>{item.note}</small><small>{lead.status} · {formatTime(item.scheduledAt)}</small></span>
              <span className={styles.rowActionGroup}><IconAction label={`View ${lead.fullName}`} icon="eye" href={`/consultant/leads/${lead.id}`} />{wa ? <IconAction label={`Open WhatsApp with ${lead.fullName}; delivery is not confirmed`} icon="whatsapp" href={wa} target="_blank" tone="whatsapp" /> : null}<IconAction label={`Mark ${lead.fullName} follow-up complete`} icon="check" onClick={() => portal.completeFollowUp(item.id)} /></span>
            </article>;
          })}</div> : <EmptyPanel title="No follow-ups due today" description="Your scheduled conversations for today will show here." icon="calendar" />}
          {dashboard.overdueFollowUps.length ? <div className={styles.overdueCallout}><span>{dashboard.overdueFollowUps.length} overdue follow-up{dashboard.overdueFollowUps.length === 1 ? "" : "s"} need attention.</span><Link className={styles.tableLink} href="/consultant/follow-ups">Review queue</Link></div> : null}
        </PortalCard>
      </div>

      <PortalCard title="Recent activity" subtitle="Recent updates on records assigned to you" action={<span className={styles.tableCount}>{dashboard.recentActivities.length} latest</span>}>
        {dashboard.recentActivities.length ? <div className={styles.activityList}>{dashboard.recentActivities.map((item) => {
          const Icon = item.activityType === "lead-converted" ? "check-circle" : item.activityType.startsWith("follow-up") ? "calendar" : item.activityType === "note-added" ? "note" : item.activityType === "status-updated" ? "sparkle" : "users";
          const lead = portal.leads.find((entry) => entry.id === item.leadId);
          return <div className={styles.activityRow} key={item.id}>
            <span className={`${styles.activityMark} ${item.activityType === "lead-converted" ? styles.activityMarkSuccess : ""}`}><AdminIcon name={Icon} size={14} /></span>
            <div><strong>{item.activityType === "lead-converted" ? "Lead converted" : item.activityType === "status-updated" ? "Lead status updated" : item.activityType === "follow-up-scheduled" ? "Follow-up scheduled" : item.activityType === "follow-up-completed" ? "Follow-up completed" : item.activityType === "note-added" ? "Note added" : "Lead assigned"}</strong><p>{item.description}{lead ? ` · ${lead.fullName}` : ""}</p><small>{item.actorName} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div>
          </div>;
        })}</div> : <EmptyPanel title="No recent activity" description="Your lead updates and completed actions will appear here." icon="clock" />}
      </PortalCard>
    </>}
  </div>;
}
