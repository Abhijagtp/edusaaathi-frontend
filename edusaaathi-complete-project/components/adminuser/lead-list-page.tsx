"use client";

import { useMemo, useState } from "react";
import type { Lead, LeadDraft, LeadSource, LeadStatus } from "@/lib/adminuser/types";
import { LEAD_SOURCES, LEAD_STATUSES, exportLeadsCsv, getConsultantName } from "@/lib/adminuser/mock-data";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, EmptyState, PageHeading, SearchField, TablePagination } from "./admin-ui";
import { LeadDialog } from "./lead-dialog";
import { LeadTable, type LeadSortField } from "./lead-table";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

type Mode = "all" | "website" | "referral";
const pageSize = 8;

const config: Record<Mode, { eyebrow: string; title: string; description: string }> = {
  all: { eyebrow: "LEAD MANAGEMENT", title: "All leads", description: "Review enquiries, update ownership and keep every student conversation moving." },
  website: { eyebrow: "INBOUND ENQUIRIES", title: "Website enquiries", description: "Manage enquiries submitted through the public website and assign the right next step." },
  referral: { eyebrow: "CONSULTANT NETWORK", title: "Referral leads", description: "Track student enquiries attributed to consultant referral links, separately from current ownership." },
};

export function LeadListPage({ mode = "all" }: { mode?: Mode }) {
  const { leads, consultants, hydrated, addLead, updateLead, assignLeads, setLeadStatuses } = useAdminData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sourceFilter, setSourceFilter] = useState("All sources");
  const [consultantFilter, setConsultantFilter] = useState("All consultants");
  const [websiteFilter, setWebsiteFilter] = useState("All enquiries");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<LeadSortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConsultant, setBulkConsultant] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [dialogLead, setDialogLead] = useState<Lead | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const matching = leads.filter((lead) => {
      if (mode === "website" && lead.source !== "Website") return false;
      if (mode === "referral" && lead.source !== "Consultant referral") return false;
      if (statusFilter !== "All statuses" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "All sources" && lead.source !== sourceFilter) return false;
      if (consultantFilter !== "All consultants" && lead.assignedConsultantId !== consultantFilter) return false;
      if (dateFrom && lead.createdAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && lead.createdAt.slice(0, 10) > dateTo) return false;
      if (mode === "website") {
        if (websiteFilter === "New" && lead.status !== "New") return false;
        if (websiteFilter === "Assigned" && !lead.assignedConsultantId) return false;
        if (websiteFilter === "Unassigned" && lead.assignedConsultantId) return false;
      }
      const referrer = getConsultantName(consultants, lead.referredByConsultantId);
      const assignee = getConsultantName(consultants, lead.assignedConsultantId);
      const text = `${lead.studentName} ${lead.phone} ${lead.email} ${lead.course} ${lead.source} ${lead.sourcePage} ${referrer} ${assignee}`.toLowerCase();
      return !normalized || text.includes(normalized);
    });
    return matching.sort((a, b) => {
      const first = a[sortBy] || "";
      const second = b[sortBy] || "";
      const compared = String(first).localeCompare(String(second), undefined, { sensitivity: "base", numeric: true });
      return sortDirection === "asc" ? compared : -compared;
    });
  }, [leads, consultants, mode, statusFilter, sourceFilter, consultantFilter, websiteFilter, dateFrom, dateTo, search, sortBy, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageLeads = filtered.slice((page - 1) * pageSize, page * pageSize);
  const visibleIds = pageLeads.map((lead) => lead.id);
  const matchingSelectedIds = selectedIds.filter((id) => filtered.some((lead) => lead.id === id));

  function changeSort(field: LeadSortField) {
    setSortDirection((direction) => sortBy === field ? direction === "asc" ? "desc" : "asc" : field === "studentName" || field === "course" || field === "source" || field === "status" ? "asc" : "desc");
    setSortBy(field);
  }

  function toggleLead(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  function toggleAllVisible() {
    setSelectedIds((current) => visibleIds.every((id) => current.includes(id)) ? current.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...current, ...visibleIds])));
  }

  function saveLead(draft: LeadDraft) {
    if (draft.id) updateLead(draft.id, draft);
    else addLead(draft);
    setDialogOpen(false);
    setDialogLead(undefined);
  }

  function applyAssignment() {
    if (!matchingSelectedIds.length) return;
    assignLeads(matchingSelectedIds, bulkConsultant === "__unassigned" || !bulkConsultant ? null : bulkConsultant);
    setSelectedIds([]);
    setBulkConsultant("");
  }

  function applyStatus() {
    if (!matchingSelectedIds.length || !bulkStatus) return;
    setLeadStatuses(matchingSelectedIds, bulkStatus as LeadStatus);
    setSelectedIds([]);
    setBulkStatus("");
  }

  const pageInfo = config[mode];
  const sourceOptions = [{ value: "All sources", label: "All sources" }, ...LEAD_SOURCES.map((source) => ({ value: source, label: source }))];
  const consultantOptions = [{ value: "All consultants", label: "All consultants" }, ...consultants.map((consultant) => ({ value: consultant.id, label: consultant.name }))];
  const selectedCount = matchingSelectedIds.length;

  return (
    <div className={styles.pageContent}>
      <PageHeading eyebrow={pageInfo.eyebrow} title={pageInfo.title} description={pageInfo.description} actions={<>
        <AdminButton icon="download" onClick={() => exportLeadsCsv(filtered, consultants, mode === "website" ? "website-enquiries.csv" : mode === "referral" ? "referral-leads.csv" : "all-leads.csv")}>Export CSV</AdminButton>
        {mode === "all" ? <AdminButton variant="primary" icon="plus" onClick={() => { setDialogLead(undefined); setDialogOpen(true); }}>Add lead</AdminButton> : null}
      </>} />

      <section className={styles.tablePanel}>
        <div className={styles.tablePanelTop}><div><strong>{filtered.length.toLocaleString("en-IN")} {mode === "website" ? "enquiries" : "leads"}</strong><span>{mode === "website" ? "Website form submissions" : mode === "referral" ? "Consultant-attributed enquiries" : "Across all sources"}</span></div><div className={styles.tableTopActions}><span className={styles.tableTopDot} />Mock dataset</div></div>
        <div className={styles.filterBar}>
          <SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Name, phone, email, course…" label="Search leads" />
          <label className={styles.filterControl}><span className={styles.srOnly}>Filter by status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option>All statuses</option>{LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className={styles.filterControl}><span className={styles.srOnly}>Filter by source</span><select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setPage(1); }}><option>All sources</option>{LEAD_SOURCES.map((source) => <option key={source}>{source}</option>)}</select></label>
          <label className={styles.filterControl}><span className={styles.srOnly}>Filter by assigned consultant</span><select value={consultantFilter} onChange={(event) => { setConsultantFilter(event.target.value); setPage(1); }}><option>All consultants</option>{consultants.map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.name}</option>)}</select></label>
          {mode === "website" ? <label className={styles.filterControl}><span className={styles.srOnly}>Filter enquiries</span><select value={websiteFilter} onChange={(event) => { setWebsiteFilter(event.target.value); setPage(1); }}><option>All enquiries</option><option>New</option><option>Assigned</option><option>Unassigned</option></select></label> : null}
          <div className={styles.dateFilters}><label><span>From</span><input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} aria-label="Created from" /></label><label><span>To</span><input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} aria-label="Created to" /></label></div>
        </div>
        {selectedCount > 0 ? <div className={styles.bulkBar}><span><strong>{selectedCount}</strong> selected</span><label><span className={styles.srOnly}>Assign selected leads</span><select value={bulkConsultant} onChange={(event) => setBulkConsultant(event.target.value)}><option value="">Assign consultant…</option><option value="__unassigned">Unassign</option>{consultants.filter((consultant) => consultant.status === "Active").map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.name}</option>)}</select></label><AdminButton icon="users" onClick={applyAssignment} disabled={!bulkConsultant}>Apply assignment</AdminButton><label><span className={styles.srOnly}>Set status for selected leads</span><select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}><option value="">Set status…</option>{LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><AdminButton onClick={applyStatus} disabled={!bulkStatus}>Update status</AdminButton><button className={styles.clearSelection} type="button" onClick={() => setSelectedIds([])}>Clear</button></div> : null}
        {hydrated && filtered.length ? <LeadTable leads={pageLeads} consultants={consultants} selectedIds={selectedIds} onToggle={toggleLead} onToggleAll={toggleAllVisible} onEdit={(lead) => { setDialogLead(lead); setDialogOpen(true); }} mode={mode} sortBy={sortBy} sortDirection={sortDirection} onSort={changeSort} /> : null}
        {hydrated && filtered.length === 0 ? <EmptyState title="No leads match this view" description={leads.length ? "Try clearing a filter or broadening your search." : "Sample leads will appear here once the demo data is loaded."} icon="users" action={mode === "all" ? <AdminButton variant="primary" icon="plus" onClick={() => setDialogOpen(true)}>Add your first lead</AdminButton> : undefined} /> : null}
        {!hydrated ? <div className={styles.tableLoading}>Loading lead data…</div> : null}
        <TablePagination page={page} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </section>

      {dialogOpen ? <LeadDialog lead={dialogLead} consultants={consultants} onClose={() => { setDialogOpen(false); setDialogLead(undefined); }} onSubmit={saveLead} /> : null}
      <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} /> Changes on this page update the local demo dataset only. No API request is made.</p>
    </div>
  );
}
