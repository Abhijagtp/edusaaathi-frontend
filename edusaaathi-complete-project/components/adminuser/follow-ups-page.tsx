"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FollowUp } from "@/lib/adminuser/types";
import { getConsultantName, getLeadWhatsAppHref, localDateString } from "@/lib/adminuser/mock-data";
import { formatDate, formatTime, relativeLabel } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, Avatar, Badge, EmptyState, PageHeading, Panel, SearchField, TablePagination } from "./admin-ui";
import { FollowUpDialog } from "./follow-up-dialog";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

const pageSize = 10;
type ViewFilter = "All follow-ups" | "Upcoming" | "Due today" | "Overdue" | "Completed";

export function FollowUpsPage() {
  const { followUps, leads, consultants, hydrated, addFollowUp, completeFollowUp } = useAdminData();
  const [filter, setFilter] = useState<ViewFilter>("All follow-ups");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<FollowUp | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const today = localDateString();

  const filtered = useMemo(() => followUps.filter((item) => {
    const lead = leads.find((entry) => entry.id === item.leadId);
    if (filter === "Completed" && item.status !== "Completed") return false;
    if (filter === "Overdue" && !(item.status === "Pending" && item.date < today)) return false;
    if (filter === "Due today" && !(item.status === "Pending" && item.date === today)) return false;
    if (filter === "Upcoming" && !(item.status === "Pending" && item.date > today)) return false;
    const term = search.trim().toLowerCase();
    const target = `${lead?.studentName ?? ""} ${lead?.course ?? ""} ${item.notes} ${getConsultantName(consultants, item.consultantId)}`.toLowerCase();
    return !term || target.includes(term);
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [followUps, leads, consultants, filter, search, today]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pending = followUps.filter((item) => item.status === "Pending").length;
  const overdue = followUps.filter((item) => item.status === "Pending" && item.date < today).length;
  const dueToday = followUps.filter((item) => item.status === "Pending" && item.date === today).length;
  const completed = followUps.filter((item) => item.status === "Completed").length;

  function startEdit(item: FollowUp) { setEditing(item); setDialogOpen(true); }
  function startAdd() { setEditing(undefined); setDialogOpen(true); }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="STUDENT SUCCESS" title="Follow-ups" description="Plan, track and complete the next conversation with every student." actions={<AdminButton variant="primary" icon="plus" onClick={startAdd}>Schedule follow-up</AdminButton>} />
    <div className={styles.followUpStatsGrid}><button type="button" className={`${styles.followUpStatCard} ${filter === "All follow-ups" ? styles.followUpStatSelected : ""}`} onClick={() => { setFilter("All follow-ups"); setPage(1); }}><span>Pending</span><strong>{pending}</strong><small>All scheduled touchpoints</small></button><button type="button" className={`${styles.followUpStatCard} ${styles.followUpStatDanger} ${filter === "Overdue" ? styles.followUpStatSelected : ""}`} onClick={() => { setFilter("Overdue"); setPage(1); }}><span>Overdue</span><strong>{overdue}</strong><small>Needs attention</small></button><button type="button" className={`${styles.followUpStatCard} ${styles.followUpStatToday} ${filter === "Due today" ? styles.followUpStatSelected : ""}`} onClick={() => { setFilter("Due today"); setPage(1); }}><span>Due today</span><strong>{dueToday}</strong><small>Scheduled for today</small></button><button type="button" className={`${styles.followUpStatCard} ${filter === "Completed" ? styles.followUpStatSelected : ""}`} onClick={() => { setFilter("Completed"); setPage(1); }}><span>Completed</span><strong>{completed}</strong><small>Logged as complete</small></button></div>
    <Panel title="Follow-up queue" subtitle={`${filtered.length} records`} action={<div className={styles.panelFilters}><SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search lead, consultant or note" label="Search follow-ups" /><label className={styles.filterControl}><span className={styles.srOnly}>Filter follow-ups</span><select value={filter} onChange={(event) => { setFilter(event.target.value as ViewFilter); setPage(1); }}><option>All follow-ups</option><option>Upcoming</option><option>Due today</option><option>Overdue</option><option>Completed</option></select></label></div>}>
      {!hydrated ? <div className={styles.tableLoading}>Loading follow-ups…</div> : pageItems.length ? <div className={styles.tableViewport}><table className={styles.dataTable}><thead><tr><th>Student</th><th>Scheduled for</th><th>Follow-up notes</th><th>Consultant</th><th>Status</th><th>Actions</th></tr></thead><tbody>{pageItems.map((item) => {
        const lead = leads.find((entry) => entry.id === item.leadId);
        const isLate = item.status === "Pending" && item.date < today;
        const isToday = item.status === "Pending" && item.date === today;
        const whatsapp = lead ? getLeadWhatsAppHref(lead.phone, lead.studentName, lead.course) : null;
        return <tr key={item.id}><td><div className={styles.studentCell}><Avatar name={lead?.studentName ?? "Student"} size="sm" /><span>{lead ? <Link href={`/adminuser/leads/${lead.id}`} className={styles.studentName}>{lead.studentName}</Link> : <strong className={styles.studentName}>Lead removed</strong>}<small>{lead?.course ?? "—"}</small></span></div></td><td><span className={styles.followUpScheduleCell}><strong>{formatDate(item.date, { day: "numeric", month: "short", year: "numeric" })}</strong><small>{formatTime(item.time)} · {relativeLabel(item.date)}</small></span></td><td><span className={styles.followUpNoteCell}>{item.notes}</span></td><td><span className={styles.assigneeCell}><Avatar name={getConsultantName(consultants, item.consultantId)} size="xs" />{getConsultantName(consultants, item.consultantId)}</span></td><td><Badge dot>{item.status === "Completed" ? "Completed" : isLate ? "Overdue" : isToday ? "Due today" : "Pending"}</Badge></td><td><div className={styles.rowActions}>{whatsapp ? <a className={styles.whatsappAction} href={whatsapp} target="_blank" rel="noreferrer" aria-label={`Open WhatsApp with ${lead?.studentName}; this does not confirm delivery`} title="Opens WhatsApp; it does not confirm delivery"><AdminIcon name="whatsapp" size={16} /></a> : null}<AdminButton className={styles.smallRowButton} onClick={() => startEdit(item)}>Edit</AdminButton>{item.status === "Pending" ? <AdminButton variant="primary" className={styles.smallRowButton} icon="check" onClick={() => completeFollowUp(item.id)}>Complete</AdminButton> : null}</div></td></tr>;
      })}</tbody></table></div> : <EmptyState title="No follow-ups in this view" description={filter === "Overdue" ? "There are no overdue touchpoints. Nice work." : "Schedule a follow-up or adjust your filters."} icon="calendar" action={<AdminButton variant="primary" icon="plus" onClick={startAdd}>Schedule follow-up</AdminButton>} />}
      <TablePagination page={page} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />
    </Panel>
    <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} />Follow-up updates remain in this browser only. WhatsApp links open a conversation; they do not confirm message delivery.</p>
    {dialogOpen ? <FollowUpDialog followUp={editing} leads={leads} consultants={consultants} onClose={() => { setDialogOpen(false); setEditing(undefined); }} onSubmit={(draft) => { addFollowUp(draft); setDialogOpen(false); setEditing(undefined); }} /> : null}
  </div>;
}
