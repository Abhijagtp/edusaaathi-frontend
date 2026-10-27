"use client";

import Link from "next/link";
import type { Activity, Lead } from "@/lib/adminuser/types";
import { getConsultantName, localDateString } from "@/lib/adminuser/mock-data";
import { formatDate, formatTime, percent } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, Avatar, Badge, EmptyState, PageHeading, Panel, StatCard } from "./admin-ui";
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
  const icon = type === "lead-created" ? "plus" : type === "status-changed" ? "check-circle" : type === "assigned" ? "users" : type === "follow-up" ? "calendar" : type === "note-added" ? "note" : type === "settings" ? "settings" : type === "course" ? "file-text" : "referral";
  return <span className={`${styles.activityIcon} ${styles[`activityIcon${type.replace(/[^a-z]/g, "")}`]}`}><AdminIcon name={icon} size={14} /></span>;
}

export function DashboardPage() {
  const { leads, consultants, followUps, activities, hydrated } = useAdminData();
  const today = localDateString();
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const contacted = leads.filter((lead) => lead.status === "Contacted").length;
  const converted = leads.filter((lead) => lead.status === "Converted").length;
  const dueFollowUps = followUps.filter((item) => item.status === "Pending" && item.date <= today).length;
  const overdue = followUps.filter((item) => item.status === "Pending" && item.date < today).length;
  const pendingFollowUps = [...followUps].filter((item) => item.status === "Pending").sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).slice(0, 5);
  const sourceData = [
    { label: "Website", value: leads.filter((lead) => lead.source === "Website").length, color: "#5146DC" },
    { label: "Consultant referral", value: leads.filter((lead) => lead.source === "Consultant referral").length, color: "#16A36A" },
    { label: "WhatsApp", value: leads.filter((lead) => lead.source === "WhatsApp").length, color: "#D97706" },
    { label: "Other", value: leads.filter((lead) => lead.source === "Walk-in" || lead.source === "Education fair").length, color: "#A8B0C1" },
  ];
  const statusData = [
    { label: "New", value: newLeads, color: "#5146DC" },
    { label: "Contacted", value: contacted, color: "#1485C7" },
    { label: "Follow-up", value: leads.filter((lead) => lead.status === "Follow-up").length, color: "#D97706" },
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
      <PageHeading eyebrow="OVERVIEW" title="Welcome back, Ananya" description="Here’s your team’s lead activity and next steps at a glance." actions={<Link href="/adminuser/leads" className={styles.textLink}>View all leads <AdminIcon name="arrow-right" size={15} /></Link>} />
      <div className={styles.statsGrid}>
        <StatCard label="Total leads" value={leads.length} helper="All sources" icon="users" tone="indigo" />
        <StatCard label="New leads" value={newLeads} helper="Awaiting first contact" icon="sparkle" tone="violet" />
        <StatCard label="Contacted" value={contacted} helper="Conversation started" icon="phone" tone="blue" />
        <StatCard label="Follow-ups due" value={dueFollowUps} helper={overdue ? `${overdue} overdue` : "Due today"} icon="calendar" tone="amber" />
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
        <Panel title="Follow-ups" subtitle="Upcoming and overdue" action={<Link href="/adminuser/follow-ups" className={styles.smallTextLink}>Manage</Link>}>
          {pendingFollowUps.length ? <div className={styles.followUpList}>{pendingFollowUps.map((item) => { const lead = leads.find((entry) => entry.id === item.leadId); const isLate = item.date < today; return <Link className={styles.followUpPreview} href={`/adminuser/leads/${item.leadId}`} key={item.id}><span className={`${styles.followUpDateMark} ${isLate ? styles.followUpDateLate : ""}`}><strong>{formatDate(item.date, { day: "numeric" })}</strong><small>{formatDate(item.date, { month: "short" })}</small></span><span className={styles.followUpPreviewInfo}><strong>{lead?.studentName ?? "Student"}</strong><small>{item.notes}</small><small>{getConsultantName(consultants, item.consultantId)} · {formatTime(item.time)}</small></span><Badge>{isLate ? "Overdue" : item.date === today ? "Due today" : "Upcoming"}</Badge></Link>; })}</div> : <EmptyState title="No pending follow-ups" description="You're all caught up." icon="calendar" />}
        </Panel>
      </div>

      <Panel title="Recent activity" subtitle="Latest updates across leads and referrals" className={styles.activityPanel}>
        {recentActivity.length ? <div className={styles.activityTimeline}>{recentActivity.map((item) => <div className={styles.activityItem} key={item.id}><ActivityIcon type={item.type} /><div><strong>{item.title}</strong><p>{item.description}</p><small>{item.actor} · {formatDate(item.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</small></div>{item.leadId ? <Link href={`/adminuser/leads/${item.leadId}`} aria-label="Open related lead"><AdminIcon name="arrow-up-right" size={15} /></Link> : null}</div>)}</div> : <EmptyState title="No recent activity" icon="sparkle" />}
      </Panel>
      <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} /> All metrics use illustrative sample data. Connect the Django API for live reporting.</p>
    </div>
  );
}
