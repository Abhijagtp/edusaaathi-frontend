"use client";

import { useEffect, useMemo, useState } from "react";
import type { Lead } from "@/lib/adminuser/types";
import { dateOffset, downloadCsvFile, getConsultantName, localDateString } from "@/lib/adminuser/mock-data";
import { formatDate, percent } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, EmptyState, PageHeading, Panel, StatCard } from "./admin-ui";
import { HorizontalBars, LeadTrendChart, SourceDonut } from "./admin-charts";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

function csvDownload(rows: Array<Array<string | number | null | undefined>>, filename: string) {
  downloadCsvFile(rows, filename);
}

function trendBuckets(leads: Lead[], from: string, to: string) {
  if (!from || !to) return [];
  const start = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);
  if (start > end) return [];
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  const step = dayCount <= 14 ? 1 : dayCount <= 120 ? 7 : 30;
  const buckets: Array<{ label: string; value: number }> = [];
  for (let offset = 0; offset < dayCount; offset += step) {
    const bucketStart = new Date(start); bucketStart.setDate(start.getDate() + offset);
    const bucketEnd = new Date(start); bucketEnd.setDate(start.getDate() + Math.min(offset + step - 1, dayCount - 1));
    const fromKey = localDateString(bucketStart); const toKey = localDateString(bucketEnd);
    const label = dayCount <= 14 ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(bucketStart) : dayCount <= 120 ? `W${Math.ceil((offset + 1) / 7)}` : new Intl.DateTimeFormat("en-IN", { month: "short" }).format(bucketStart);
    buckets.push({ label, value: leads.filter((lead) => lead.createdAt.slice(0, 10) >= fromKey && lead.createdAt.slice(0, 10) <= toKey).length });
  }
  return buckets;
}

export function AnalyticsPage() {
  const { leads, consultants, hydrated } = useAdminData();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  useEffect(() => {
    if (!hydrated || dateFrom || dateTo) return;
    setDateFrom(dateOffset(-29)); setDateTo(localDateString());
  }, [hydrated, dateFrom, dateTo]);

  const filteredLeads = useMemo(() => leads.filter((lead) => (!dateFrom || lead.createdAt.slice(0, 10) >= dateFrom) && (!dateTo || lead.createdAt.slice(0, 10) <= dateTo)), [leads, dateFrom, dateTo]);
  const converted = filteredLeads.filter((lead) => lead.status === "Converted").length;
  const contacted = filteredLeads.filter((lead) => Boolean(lead.lastContactedAt)).length;
  const unassigned = filteredLeads.filter((lead) => !lead.assignedConsultantId).length;
  const avgResponseHours = filteredLeads.filter((lead) => lead.lastContactedAt).reduce((sum, lead, _, array) => sum + (new Date(lead.lastContactedAt!).getTime() - new Date(lead.createdAt).getTime()) / 3600000 / array.length, 0);
  const sourceData = [
    { label: "Website", value: filteredLeads.filter((lead) => lead.source === "Website").length, color: "#5146DC" },
    { label: "Consultant referral", value: filteredLeads.filter((lead) => lead.source === "Consultant referral").length, color: "#16A36A" },
    { label: "WhatsApp", value: filteredLeads.filter((lead) => lead.source === "WhatsApp").length, color: "#D97706" },
    { label: "Walk-in / fair", value: filteredLeads.filter((lead) => lead.source === "Walk-in" || lead.source === "Education fair").length, color: "#A8B0C1" },
  ];
  const statusData = [
    { label: "New", value: filteredLeads.filter((lead) => lead.status === "New").length, color: "#5146DC" },
    { label: "Contacted", value: filteredLeads.filter((lead) => lead.status === "Contacted").length, color: "#1485C7" },
    { label: "In progress", value: filteredLeads.filter((lead) => lead.status === "In progress").length, color: "#D97706" },
    { label: "Converted", value: converted, color: "#16A36A" },
    { label: "Lost", value: filteredLeads.filter((lead) => lead.status === "Lost").length, color: "#DC4C4C" },
  ];
  const courseData = Array.from(filteredLeads.reduce((map, lead) => map.set(lead.course, (map.get(lead.course) || 0) + 1), new Map<string, number>()).entries()).map(([label, value]) => ({ label, value, color: "#5146DC" })).sort((a, b) => b.value - a.value).slice(0, 6);
  const consultantData = consultants.map((consultant) => ({
    label: consultant.name.split(" ")[0],
    value: filteredLeads.filter((lead) => lead.referredByConsultantId === consultant.id && lead.status === "Converted").length,
    color: consultant.status === "Active" ? "#16A36A" : "#A8B0C1",
  })).sort((a, b) => b.value - a.value).slice(0, 6);
  const totalNotes = filteredLeads.reduce((sum, lead) => sum + (lead.notes?.length || 0), 0);
  const trend = trendBuckets(filteredLeads, dateFrom, dateTo);
  const bySource = ["Website", "Consultant referral", "WhatsApp", "Walk-in", "Education fair"].map((source) => {
    const sourceLeads = filteredLeads.filter((lead) => lead.source === source);
    const sourceConverted = sourceLeads.filter((lead) => lead.status === "Converted").length;
    return { source, leads: sourceLeads.length, converted: sourceConverted, rate: percent(sourceConverted, sourceLeads.length) };
  });

  function exportReport() {
    const rows = [
      ["Metric", "Value"],
      ["Report start date", dateFrom], ["Report end date", dateTo], ["Total leads", String(filteredLeads.length)],
      ["Converted", String(converted)], ["Conversion rate", percent(converted, filteredLeads.length)], ["Contacted", String(contacted)],
      ["Unassigned", String(unassigned)], ["Counselor notes logged in range", String(totalNotes)], ["Average hours to first contact", avgResponseHours.toFixed(1)],
      [], ["Source", "Leads", "Converted", "Conversion rate"], ...bySource.map((row) => [row.source, String(row.leads), String(row.converted), row.rate]),
      [], ["Student", "Phone", "Email", "Course", "Source", "Referring consultant", "Assigned consultant", "Status", "Created"],
      ...filteredLeads.map((lead) => [lead.studentName, lead.phone, lead.email, lead.course, lead.source, getConsultantName(consultants, lead.referredByConsultantId), getConsultantName(consultants, lead.assignedConsultantId), lead.status, lead.createdAt]),
    ];
    csvDownload(rows, "edusaaathi-analytics.csv");
  }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="INSIGHTS" title="Analytics & reports" description="Understand lead sources, pipeline health and consultant referral performance." actions={<AdminButton icon="download" onClick={exportReport}>Export report CSV</AdminButton>} />
    <Panel title="Reporting period" subtitle="Metrics are filtered by lead creation date" className={styles.dateRangePanel}>
      <div className={styles.analyticsDateRange}><label className={styles.field}><span>From date</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><AdminIcon name="arrow-right" size={16} /><label className={styles.field}><span>To date</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label><span className={styles.rangeCount}>{filteredLeads.length} leads in range</span></div>
    </Panel>
    <div className={styles.statsGrid}>
      <StatCard label="Leads in range" value={filteredLeads.length} helper="By enquiry date" icon="users" tone="indigo" />
      <StatCard label="Converted" value={converted} helper="Marked converted" icon="check-circle" tone="green" />
      <StatCard label="Conversion rate" value={percent(converted, filteredLeads.length)} helper="Converted ÷ leads" icon="target" tone="violet" />
      <StatCard label="Contacted" value={contacted} helper="Has a contact timestamp" icon="phone" tone="blue" />
      <StatCard label="Unassigned" value={unassigned} helper="Needs an owner" icon="user" tone="amber" />
      <StatCard label="Counselor notes" value={totalNotes} helper="Logged on student leads" icon="file-text" tone="rose" />
    </div>
    <div className={styles.dashboardGridTop}>
      <Panel title="Lead trend" subtitle="Enquiries created in the selected period" action={<span className={styles.chartLegend}><i /> Leads</span>} className={styles.trendPanel}>
        {filteredLeads.length ? <LeadTrendChart data={trend} /> : <EmptyState title="No leads in this period" description="Choose a wider date range to see the trend." icon="chart" />}
      </Panel>
      <Panel title="Source mix" subtitle="Channel distribution for this period">
        {filteredLeads.length ? <SourceDonut data={sourceData} total={filteredLeads.length} /> : <EmptyState title="No source data" icon="chart" />}
      </Panel>
    </div>
    <div className={styles.dashboardGridMid}>
      <Panel title="Pipeline status" subtitle="Leads by current status"><HorizontalBars data={statusData} label="Leads by pipeline status" /></Panel>
      <Panel title="Course interest" subtitle="Most requested programs"><HorizontalBars data={courseData} label="Leads by course" /></Panel>
    </div>
    <div className={styles.dashboardGridBottom}>
      <Panel title="Referral conversions" subtitle="Converted leads by original referrer"><HorizontalBars data={consultantData} label="Referral conversions by consultant" /></Panel>
      <Panel title="Source performance" subtitle="Lead-to-conversion rate by channel"><div className={styles.tableViewport}><table className={styles.compactTable}><thead><tr><th>Source</th><th>Leads</th><th>Converted</th><th>Rate</th></tr></thead><tbody>{bySource.map((item) => <tr key={item.source}><td>{item.source}</td><td>{item.leads}</td><td>{item.converted}</td><td><strong>{item.rate}</strong></td></tr>)}</tbody></table></div></Panel>
    </div>
    <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} />Analytics use browser-local demo data only. Average first-contact time is calculated from mock lead timestamps.</p>
  </div>;
}
