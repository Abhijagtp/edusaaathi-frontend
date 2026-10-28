"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadCsvFile } from "@/lib/adminuser/mock-data";
import { formatDate } from "@/lib/adminuser/format";
import { getConsultantPhoneHref, getConsultantWhatsAppHref, getMyLeads } from "@/lib/consultant/mock-service";
import { CONSULTANT_LEAD_SOURCES, CONSULTANT_LEAD_STATUSES, type ConsultantLead, type ConsultantLeadStatus } from "@/lib/consultant/types";
import { useConsultantPortal } from "./consultant-provider";
import { AddNoteDialog } from "./consultant-dialogs";
import { EmptyPanel, IconAction, PageHeader, PortalButton, PortalCard, PortalAvatar, TableCaption } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

const PAGE_SIZE = 8;

export function ConsultantLeadsPage() {
  const portal = useConsultantPortal();
  const allLeads = useMemo(() => getMyLeads(portal), [portal.leads, portal.profile.id]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [source, setSource] = useState("All sources");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [noteLead, setNoteLead] = useState<ConsultantLead | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allLeads.filter((lead) => {
      const matchesTerm = !term || `${lead.fullName} ${lead.phone} ${lead.email}`.toLowerCase().includes(term);
      const matchesStatus = status === "All statuses" || lead.status === status;
      const matchesSource = source === "All sources" || lead.source === source;
      const date = lead.createdAt.slice(0, 10);
      const matchesFrom = !fromDate || date >= fromDate;
      const matchesTo = !toDate || date <= toDate;
      return matchesTerm && matchesStatus && matchesSource && matchesFrom && matchesTo;
    }).sort((a, b) => {
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "status") return a.status.localeCompare(b.status) || b.createdAt.localeCompare(a.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [allLeads, search, status, source, fromDate, toDate, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const rows = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, status, source, fromDate, toDate, sort]);

  function updateStatus(lead: ConsultantLead, nextStatus: ConsultantLeadStatus) {
    if (lead.status === nextStatus) return;
    if ((nextStatus === "Converted" || nextStatus === "Lost") && !window.confirm(`Mark ${lead.fullName} as ${nextStatus.toLowerCase()}?`)) return;
    portal.updateMyLead(lead.id, { status: nextStatus });
  }

  function exportMyLeads() {
    const rows: Array<Array<string | number | null>> = [
      ["Student name", "Phone", "Email", "Interested course", "Lead source", "Status", "Last contacted", "Notes count", "Created date"],
      ...allLeads.map((lead) => [lead.fullName, lead.phone, lead.email, lead.interestedCourse, lead.source, lead.status, lead.lastContactedAt ?? "", lead.notes?.length || 0, lead.createdAt]),
    ];
    downloadCsvFile(rows, "edusaaathi-my-leads-demo.csv");
    portal.announce("Your assigned leads have been exported to CSV.");
  }

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="STUDENT MANAGEMENT" title="My Leads" description="Search and manage the student enquiries assigned to your consultant account." actions={<><PortalButton icon="download" onClick={exportMyLeads} disabled={!portal.hydrated}>Export my leads</PortalButton></>} />
    <PortalCard title="Assigned student leads" subtitle={`${filtered.length} of ${allLeads.length} assigned records`}>
      <div className={styles.tableToolbar}>
        <div className={styles.filterGroup}>
          <label className={styles.searchField}><AdminIcon name="search" size={15} /><span className={styles.srOnly}>Search leads by student name, phone or email</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone or email" /></label>
          <label className={styles.filterControl}><span className={styles.srOnly}>Filter by lead status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{CONSULTANT_LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className={styles.filterControl}><span className={styles.srOnly}>Filter by lead source</span><select value={source} onChange={(event) => setSource(event.target.value)}><option>All sources</option>{CONSULTANT_LEAD_SOURCES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className={styles.filterControl}><span className={styles.srOnly}>Sort leads</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="status">Status</option></select></label>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.dateFilter}><span>From</span><input type="date" aria-label="Created on or after" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label className={styles.dateFilter}><span>To</span><input type="date" aria-label="Created on or before" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
          {(search || status !== "All statuses" || source !== "All sources" || fromDate || toDate) ? <PortalButton variant="quiet" onClick={() => { setSearch(""); setStatus("All statuses"); setSource("All sources"); setFromDate(""); setToDate(""); }}>Clear</PortalButton> : null}
        </div>
      </div>
      {!portal.hydrated ? <p className={styles.tableMuted} role="status">Loading your leads…</p> : filtered.length ? <>
        <div className={styles.tableViewport}><table className={styles.dataTable}>
          <TableCaption>My assigned student lead table with contact, course, source, status and notes details</TableCaption>
          <thead><tr><th scope="col">Student name</th><th scope="col">Phone</th><th scope="col">Email</th><th scope="col">Interested course</th><th scope="col">Lead source</th><th scope="col">Status</th><th scope="col">Last contacted</th><th scope="col">Notes</th><th scope="col">Created date</th><th scope="col">Actions</th></tr></thead>
          <tbody>{rows.map((lead) => {
            const wa = getConsultantWhatsAppHref(lead.phone, lead.fullName, lead.interestedCourse, portal.profile.fullName);
            const phone = getConsultantPhoneHref(lead.phone);
            return <tr key={lead.id}>
              <td><div className={styles.personCell}><PortalAvatar name={lead.fullName} size="sm" /><span><strong>{lead.fullName}</strong><small>{lead.city ?? "Student enquiry"}</small></span></div></td>
              <td>{phone ? <a className={styles.tableLink} href={phone}>{lead.phone}</a> : <span className={styles.tableMuted}>{lead.phone}</span>}</td>
              <td><a className={styles.tableLink} href={`mailto:${lead.email}`}>{lead.email}</a></td>
              <td><span className={styles.tableMainText}>{lead.interestedCourse}</span></td>
              <td><span className={styles.tableMainText}>{lead.source}</span></td>
              <td><label><span className={styles.srOnly}>Update status for {lead.fullName}</span><select className={styles.inlineStatusSelect} value={lead.status} onChange={(event) => updateStatus(lead, event.target.value as ConsultantLeadStatus)}>{CONSULTANT_LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label></td>
              <td>{lead.lastContactedAt ? formatDate(lead.lastContactedAt, { day: "numeric", month: "short" }) : <span className={styles.tableMuted}>Not contacted</span>}</td>
              <td><button type="button" onClick={() => setNoteLead(lead)} className={styles.tableLink} title="Click to view or add notes">{lead.notes?.length ? `${lead.notes.length} note(s)` : "+ Add note"}</button></td>
              <td>{formatDate(lead.createdAt, { day: "numeric", month: "short", year: "numeric" })}</td>
              <td><div className={styles.rowActionGroup}><IconAction label={`View ${lead.fullName}`} icon="eye" href={`/consultant/leads/${lead.id}`} />{phone ? <IconAction label={`Call ${lead.fullName}`} icon="phone" href={phone} /> : null}{wa ? <IconAction label={`Open WhatsApp with ${lead.fullName}; message delivery is not confirmed`} icon="whatsapp" href={wa} target="_blank" tone="whatsapp" /> : null}<IconAction label={`Add a note for ${lead.fullName}`} icon="note" onClick={() => setNoteLead(lead)} /></div></td>
            </tr>;
          })}</tbody>
        </table></div>
        <div className={styles.tableFooter}><span className={styles.tableCount}>Showing {Math.min(filtered.length, (visiblePage - 1) * PAGE_SIZE + 1)}–{Math.min(filtered.length, visiblePage * PAGE_SIZE)} of {filtered.length}</span><div className={styles.paginationGroup}><button type="button" className={styles.iconAction} aria-label="Previous page" disabled={visiblePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><AdminIcon name="chevron-left" size={15} /></button><span>Page {visiblePage} of {pageCount}</span><button type="button" className={styles.iconAction} aria-label="Next page" disabled={visiblePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><AdminIcon name="chevron-right" size={15} /></button></div></div>
      </> : <EmptyPanel title="No matching leads" description="Try changing your search or filters. Only leads assigned to your account are shown here." icon="users" action={<PortalButton onClick={() => { setSearch(""); setStatus("All statuses"); setSource("All sources"); setFromDate(""); setToDate(""); }}>Clear filters</PortalButton>} />}
    </PortalCard>
    {noteLead ? <AddNoteDialog lead={noteLead} onClose={() => setNoteLead(null)} onSave={(note) => portal.addLeadNote(noteLead.id, note)} /> : null}
  </div>;
}
