"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { downloadCsvFile, getConsultantName, getReferralUrl } from "@/lib/adminuser/mock-data";
import { formatDate, percent } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, Avatar, Badge, EmptyState, PageHeading, Panel, SearchField } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

function downloadCsv(rows: Array<Array<string | number | null | undefined>>, filename: string) {
  downloadCsvFile(rows, filename);
}

export function ReferralsPage() {
  const { consultants, leads, referrals, settings, hydrated } = useAdminData();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [consultantFilter, setConsultantFilter] = useState("all");
  const [copiedId, setCopiedId] = useState("");
  const matchingRefs = useMemo(() => referrals.filter((referral) => {
    const lead = leads.find((entry) => entry.id === referral.leadId);
    const consultant = consultants.find((entry) => entry.id === referral.consultantId);
    const term = search.trim().toLowerCase();
    const text = `${lead?.studentName ?? ""} ${lead?.course ?? ""} ${consultant?.name ?? ""} ${consultant?.referralCode ?? ""} ${referral.campaign}`.toLowerCase();
    return (consultantFilter === "all" || referral.consultantId === consultantFilter) && (!dateFrom || referral.createdAt.slice(0, 10) >= dateFrom) && (!dateTo || referral.createdAt.slice(0, 10) <= dateTo) && (!term || text.includes(term));
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [referrals, leads, consultants, search, dateFrom, dateTo, consultantFilter]);
  const filteredConsultants = consultants.filter((consultant) => consultantFilter === "all" || consultant.id === consultantFilter).filter((consultant) => !search.trim() || `${consultant.name} ${consultant.referralCode}`.toLowerCase().includes(search.trim().toLowerCase()));
  const totalClicks = consultants.reduce((sum, item) => sum + item.referralClicks, 0);
  const convertedReferrals = matchingRefs.filter((item) => leads.find((lead) => lead.id === item.leadId)?.status === "Converted").length;
  const activePartners = consultants.filter((item) => item.status === "Active").length;
  const totalAttributed = matchingRefs.length;

  async function copyLink(id: string, url: string) {
    try { await navigator.clipboard.writeText(url); setCopiedId(id); window.setTimeout(() => setCopiedId(""), 1800); }
    catch { setCopiedId(""); }
  }

  function exportReferrals() {
    const rows = [["Student", "Course", "Referring consultant", "Referral code", "Campaign", "Lead status", "Currently assigned to", "Referred date"], ...matchingRefs.map((referral) => {
      const lead = leads.find((entry) => entry.id === referral.leadId);
      const consultant = consultants.find((entry) => entry.id === referral.consultantId);
      return [lead?.studentName ?? "Lead removed", lead?.course ?? "", consultant?.name ?? "Former consultant", consultant?.referralCode ?? "", referral.campaign, lead?.status ?? "", getConsultantName(consultants, lead?.assignedConsultantId), referral.createdAt];
    })];
    downloadCsv(rows, "referral-attributions.csv");
  }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="CONSULTANT NETWORK" title="Referral tracking" description="Review referral links, sample click counts and the leads originally attributed to each consultant." actions={<AdminButton icon="download" onClick={exportReferrals}>Export attributions</AdminButton>} />
    <div className={styles.fourStatsGrid}><div className={styles.summaryStat}><span>Link clicks</span><strong>{totalClicks.toLocaleString("en-IN")}</strong><small>Illustrative sample counters</small></div><div className={styles.summaryStat}><span>Attributed leads</span><strong>{totalAttributed}</strong><small>In the selected date range</small></div><div className={styles.summaryStat}><span>Referral conversions</span><strong>{convertedReferrals}</strong><small>{percent(convertedReferrals, totalAttributed)} of selected attributions</small></div><div className={styles.summaryStat}><span>Active consultants</span><strong>{activePartners}</strong><small>Historical attribution is retained</small></div></div>
    <Panel title="Referral link performance" subtitle="Unique public links by consultant" action={<div className={styles.panelFilters}><SearchField value={search} onChange={setSearch} placeholder="Search name or code" label="Search referral links" /><label className={styles.filterControl}><span className={styles.srOnly}>Filter consultant</span><select value={consultantFilter} onChange={(event) => setConsultantFilter(event.target.value)}><option value="all">All consultants</option>{consultants.map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.name}</option>)}</select></label></div>}>
      {!hydrated ? <div className={styles.tableLoading}>Loading referral data…</div> : filteredConsultants.length ? <div className={styles.tableViewport}><table className={styles.dataTable}><thead><tr><th>Consultant</th><th>Referral code</th><th>Referral link</th><th>Sample clicks</th><th>Attributed leads</th><th>Converted</th><th>Conversion</th><th>Status</th></tr></thead><tbody>{filteredConsultants.map((consultant) => {
        const codeLeads = leads.filter((lead) => lead.referredByConsultantId === consultant.id);
        const codeConversions = codeLeads.filter((lead) => lead.status === "Converted").length;
        const url = getReferralUrl(settings.websiteBaseUrl, consultant.referralCode);
        return <tr key={consultant.id}><td><div className={styles.studentCell}><Avatar name={consultant.name} size="sm" /><span><Link href="/adminuser/consultants" className={styles.studentName}>{consultant.name}</Link><small>{consultant.email}</small></span></div></td><td><code className={styles.referralCode}>{consultant.referralCode}</code></td><td><div className={styles.linkCell}><a href={url} target="_blank" rel="noreferrer" title="Open public referral link">{url}</a><button type="button" aria-label={`Copy referral link for ${consultant.name}`} onClick={() => void copyLink(consultant.id, url)}><AdminIcon name={copiedId === consultant.id ? "check" : "copy"} size={14} /></button></div></td><td><strong>{consultant.referralClicks.toLocaleString("en-IN")}</strong></td><td>{codeLeads.length}</td><td>{codeConversions}</td><td><span className={styles.rateCell}>{percent(codeConversions, codeLeads.length)}</span></td><td><Badge dot>{consultant.status}</Badge></td></tr>;
      })}</tbody></table></div> : <EmptyState title="No matching referral links" description="Try a broader search or select all consultants." icon="link" />}
    </Panel>
    <Panel title="Referral attributions" subtitle={`${matchingRefs.length} referred leads`} action={<div className={styles.dateFilters}><label><span>From</span><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Filter referrals from date" /></label><label><span>To</span><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Filter referrals to date" /></label></div>}>
      {matchingRefs.length ? <div className={styles.tableViewport}><table className={styles.dataTable}><thead><tr><th>Student</th><th>Originally referred by</th><th>Current assignee</th><th>Campaign</th><th>Status</th><th>Referred date</th></tr></thead><tbody>{matchingRefs.map((referral) => {
        const lead = leads.find((entry) => entry.id === referral.leadId);
        const consultant = consultants.find((entry) => entry.id === referral.consultantId);
        return <tr key={referral.id}><td><div className={styles.studentCell}><Avatar name={lead?.studentName ?? "Lead"} size="sm" /><span>{lead ? <Link href={`/adminuser/leads/${lead.id}`} className={styles.studentName}>{lead.studentName}</Link> : <strong>Lead removed</strong>}<small>{lead?.course ?? "—"}</small></span></div></td><td><span className={styles.assigneeCell}><Avatar name={consultant?.name ?? "Former consultant"} size="xs" />{consultant?.name ?? "Former consultant"}</span><small className={styles.subCellCode}>{consultant?.referralCode ?? "—"}</small></td><td>{getConsultantName(consultants, lead?.assignedConsultantId)}</td><td><span className={styles.mutedCell}>{referral.campaign}</span></td><td><Badge dot>{lead?.status ?? "Unknown"}</Badge></td><td>{formatDate(referral.createdAt)}</td></tr>;
      })}</tbody></table></div> : <EmptyState title="No attributions in this date range" description="Adjust the date filter or select all consultants." icon="referral" />}
    </Panel>
    <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} />Referral click totals are sample counters only. Referral URLs use the configured public website URL; this frontend does not track real visits.</p>
  </div>;
}
