"use client";

import Link from "next/link";
import type { Activity, Lead } from "@/lib/adminuser/types";
import { localDateString } from "@/lib/adminuser/mock-data";
import { formatDate, percent } from "@/lib/adminuser/format";
import { ADMINISTRATOR_NAME } from "@/lib/adminuser/mock-data";
import { useAdminData } from "./admin-data-provider";
import { useAdminSession } from "./admin-session-provider";
import { Avatar, Badge, EmptyState, PageHeading, Panel, StatCard } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import { HorizontalBars, LeadTrendChart, SourceDonut } from "./admin-charts";
import styles from "./admin.module.css";

function trendPoints(leads: Lead[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = localDateString(date);
    return { key, label: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date), value: leads.filter((lead) => lead.createdAt.slice(0, 10) === key).length };
  });
  return days;
}

function ActivityIcon({ type }: { type: Activity["type"] }) {
  const icon = type === "lead-created" ? "plus" : type === "status-changed" ? "check-circle" : type === "assigned" ? "users" : type === "note-added" ? "note" : type === "settings" ? "settings" : type === "course" ? "file-text" : "referral";
  return <span className={`${styles.activityIcon} ${styles[`activityIcon${type.replace(/[^a-z]/g, "")}`]}`}><AdminIcon name={icon} size={14} /></span>;
}

export function DashboardPage() {
  const { leads, consultants, activities, hydrated } = useAdminData();
  const { session } = useAdminSession();
  const adminName = session?.name || ADMINISTRATOR_NAME;
  const firstName = adminName.split(/\s+/)[0] || adminName;
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const contacted = leads.filter((lead) => lead.status === "Contacted").length;
  const inProgress = leads.filter((lead) => lead.status === "In progress").length;
  const converted = leads.filter((lead) => lead.status === "Converted").length;
  const totalNotes = leads.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0);

  // Extract all notes sorted by recent
  const allLeadNotes = leads
    .flatMap((lead) => (lead.notes || []).map((n) => ({ ...n, leadId: lead.id, studentName: lead.studentName, course: lead.course })))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const sourceData = [
    { label: "Website", value: leads.filter((lead) => lead.source === "Website").length, color: "#5146DC" },
    { label: "Consultant referral", value: leads.filter((lead) => lead.source === "Consultant referral").length, color: "#16A36A" },
    { label: "WhatsApp", value: leads.filter((lead) => lead.source === "WhatsApp").length, color: "#D97706" },
    { label: "Other", value: leads.filter((lead) => lead.source === "Walk-in" || lead.source === "Education fair").length, color: "#A8B0C1" },
  ];
  const statusData = [
    { label: "New", value: newLeads, color: "#5146DC" },
    { label: "Contacted", value: contacted, color: "#1485C7" },
    { label: "In progress", value: inProgress, color: "#D97706" },
    { label: "Converted", value: converted, color: "#16A36A" },
    { label: "Lost", value: leads.filter((lead) => lead.status === "Lost").length, color: "#DC4C4C" },
  ];
  const consultantPerformance = consultants.map((consultant) => {
    const assigned = leads.filter((lead) => lead.assignedConsultantId === consultant.id);
    const conversions = assigned.filter((lead) => lead.status === "Converted").length;
    return { name: consultant.name, assigned: assigned.length, conversions, rate: assigned.length ? Math.round((conversions / assigned.length) * 100) : 0 };
  }).sort((a, b) => b.conversions - a.conversions || b.assigned - a.assigned).slice(0, 5);
  const recentLeads = [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const recentActivity = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  return (
    <div className={styles.pageContent}>
      <PageHeading eyebrow="OVERVIEW" title={`Welcome back, ${firstName}`} description="Here’s your team’s lead activity and counseling notes at a glance." actions={<Link href="/adminuser/leads" className={styles.textLink}>View all leads <AdminIcon name="arrow-right" size={15} /></Link>} />
      <div className={styles.statsGrid}>
        <StatCard label="Total leads" value={leads.length} helper="All sources" icon="users" tone="indigo" />
        <StatCard label="New leads" value={newLeads} helper="Awaiting first contact" icon="sparkle" tone="violet" />
        <StatCard label="Contacted" value={contacted} helper="Conversation started" icon="phone" tone="blue" />
        <StatCard label="Counselor Notes" value={totalNotes} helper="Logged on leads" icon="note" tone="amber" />
        <StatCard label="Converted" value={converted} helper="Marked converted" icon="check-circle" tone="green" />
        <StatCard label="Conversion rate" value={percent(converted, leads.length)} helper="Converted ÷ total leads" icon="target" tone="rose" />
      </div>

      <div className={styles.dashboardGridTop}>
        <Panel title="Lead acquisition" subtitle="New leads over the last 7 days" action={<span className={styles.chartLegend}><i /> New leads</span>} className={styles.trendPanel}>
          {hydrated && leads.length ? <LeadTrendChart data={trendPoints(leads)} /> : <EmptyState title="Trend will appear here" description="Sample leads load automatically in demo mode." icon="chart" />}
        </Panel>
        <Panel title="Lead sources" subtitle="Where enquiries are coming from">
          {hydrated && leads.length ? <SourceDonut data={sourceData} total={leads.length} /> : <EmptyState title="No source data yet" icon="referral" />}
        </Panel>
      </div>

      <div className={styles.dashboardGridMid}>
        <Panel title="Lead status" subtitle="Current pipeline distribution">
          <HorizontalBars data={statusData} label="Lead status breakdown" />
        </Panel>
        <Panel title="Consultant performance" subtitle="Assigned leads and conversions" action={<Link href="/adminuser/consultants" className={styles.smallTextLink}>View team</Link>}>
          <div className={styles.performanceList}>{consultantPerformance.map((person, index) => <div className={styles.performanceRow} key={person.name}><span className={styles.performanceRank}>{String(index + 1).padStart(2, "0")}</span><Avatar name={person.name} size="sm" /><span className={styles.performanceName}><strong>{person.name}</strong><small>{person.assigned} assigned · {person.rate}% converted</small></span><span className={styles.performanceConversions}>{person.conversions}<small>converted</small></span></div>)}</div>
        </Panel>
      </div>

      <div className={styles.dashboardGridBottom}>
        <Panel title="Recent leads" subtitle="Most recently created" action={<Link href="/adminuser/leads" className={styles.smallTextLink}>See all</Link>}>
          {hydrated && recentLeads.length ? <div className={styles.recentLeadList}>{recentLeads.slice(0, 5).map((lead) => <Link href={`/adminuser/leads/${lead.id}`} className={styles.recentLeadRow} key={lead.id}><Avatar name={lead.studentName} size="sm" /><span className={styles.recentLeadInfo}><strong>{lead.studentName}</strong><small>{lead.course} · {lead.source}</small></span><Badge>{lead.status}</Badge><time>{formatDate(lead.createdAt, { day: "numeric", month: "short" })}</time></Link>)}</div> : <EmptyState title="No leads yet" icon="users" />}
        </Panel>
        <Panel title="Recent Lead Notes" subtitle="Latest counselor interactions logged" action={<Link href="/adminuser/leads" className={styles.smallTextLink}>View leads</Link>}>
          {allLeadNotes.length ? (
            <div className={styles.notesList}>
              {allLeadNotes.map((item) => (
                <Link href={`/adminuser/leads/${item.leadId}`} key={item.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <article className={styles.noteCard} style={{ cursor: "pointer" }}>
                    <span className={styles.noteIcon}><AdminIcon name="note" size={15} /></span>
                    <div>
                      <strong style={{ fontSize: 13, color: "#0f172a" }}>{item.studentName} <span style={{ color: "#64748b", fontWeight: 400, fontSize: 12 }}>({item.course})</span></strong>
                      <p style={{ margin: "2px 0 3px", fontSize: 12.5, color: "#334155" }}>{item.text}</p>
                      <small style={{ color: "#94a3b8", fontSize: 11 }}>{item.author} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No counselor notes yet" description="Click on any lead in the table to log consultation notes." icon="note" />
          )}
        </Panel>
      </div>

      <Panel title="Recent activity" subtitle="Latest updates across leads and referrals" className={styles.activityPanel}>
        {recentActivity.length ? <div className={styles.activityTimeline}>{recentActivity.map((item) => <div className={styles.activityItem} key={item.id}><ActivityIcon type={item.type} /><div><strong>{item.title}</strong><p>{item.description}</p><small>{item.actor} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div>{item.leadId ? <Link href={`/adminuser/leads/${item.leadId}`} aria-label="Open related lead"><AdminIcon name="arrow-up-right" size={15} /></Link> : null}</div>)}</div> : <EmptyState title="No recent activity" icon="sparkle" />}
      </Panel>
      <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} /> Connected to Django REST Framework &amp; Neon PostgreSQL. Synchronized in real time.</p>
    </div>
  );
}
