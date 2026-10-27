"use client";

import Link from "next/link";
import type { Lead, Consultant } from "@/lib/adminuser/types";
import { getConsultantName, getLeadWhatsAppHref } from "@/lib/adminuser/mock-data";
import { formatDate } from "@/lib/adminuser/format";
import { AdminIcon } from "./admin-icon";
import { Avatar, Badge, IconButton } from "./admin-ui";
import styles from "./admin.module.css";

export type LeadSortField = "studentName" | "course" | "source" | "createdAt" | "lastContactedAt" | "status";

export function LeadTable({
  leads, consultants, selectedIds, onToggle, onToggleAll, onEdit, mode = "all", sortBy, sortDirection, onSort,
}: {
  leads: Lead[];
  consultants: Consultant[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (lead: Lead) => void;
  mode?: "all" | "website" | "referral";
  sortBy: LeadSortField;
  sortDirection: "asc" | "desc";
  onSort: (field: LeadSortField) => void;
}) {
  const allSelected = leads.length > 0 && leads.every((lead) => selectedIds.includes(lead.id));
  const sortable = (label: string, field: LeadSortField) => <th scope="col" aria-sort={sortBy === field ? sortDirection === "asc" ? "ascending" : "descending" : "none"}><button type="button" className={styles.sortButton} onClick={() => onSort(field)} aria-label={`Sort by ${label}`}>{label}<AdminIcon name={sortBy === field ? sortDirection === "asc" ? "chevron-down" : "chevron-up" : "chevron-down"} size={13} /></button></th>;

  return (
    <div className={styles.tableViewport}>
      <table className={styles.dataTable}>
        <caption className={styles.srOnly}>{mode === "website" ? "Website enquiry records" : mode === "referral" ? "Referral lead records" : "All lead records"}</caption>
        <thead><tr>
          <th scope="col" className={styles.checkboxColumn}><input aria-label="Select all visible leads" type="checkbox" checked={allSelected} onChange={onToggleAll} /></th>
          {sortable("Student", "studentName")}
          {sortable("Course", "course")}
          {sortable("Source", "source")}
          {mode === "website" ? <th scope="col">Source page</th> : <th scope="col">Referred by</th>}
          <th scope="col">Assigned consultant</th>
          {sortable("Status", "status")}
          {sortable("Last contacted", "lastContactedAt")}
          {sortable("Created", "createdAt")}
          <th scope="col" className={styles.actionsColumn}>Actions</th>
        </tr></thead>
        <tbody>
          {leads.map((lead) => {
            const whatsappHref = getLeadWhatsAppHref(lead.phone, lead.studentName, lead.course);
            return <tr key={lead.id}>
              <td className={styles.checkboxColumn}><input aria-label={`Select ${lead.studentName}`} type="checkbox" checked={selectedIds.includes(lead.id)} onChange={() => onToggle(lead.id)} /></td>
              <td><div className={styles.studentCell}><Avatar name={lead.studentName} size="sm" /><span><Link href={`/adminuser/leads/${lead.id}`} className={styles.studentName}>{lead.studentName}</Link><small>{lead.phone}</small><small>{lead.email}</small></span></div></td>
              <td><span className={styles.courseCell}>{lead.course}</span></td>
              <td><Badge>{lead.source}</Badge></td>
              {mode === "website" ? <td><span className={styles.mutedCell}>{lead.sourcePage || "—"}</span></td> : <td><span className={styles.mutedCell}>{getConsultantName(consultants, lead.referredByConsultantId)}</span></td>}
              <td><span className={styles.assigneeCell}>{lead.assignedConsultantId ? <Avatar name={getConsultantName(consultants, lead.assignedConsultantId)} size="xs" /> : <span className={styles.unassignedDot} />} {getConsultantName(consultants, lead.assignedConsultantId)}</span></td>
              <td><Badge dot>{lead.status}</Badge></td>
              <td><span className={styles.dateCell}>{lead.lastContactedAt ? formatDate(lead.lastContactedAt) : "—"}</span></td>
              <td><span className={styles.dateCell}>{formatDate(lead.createdAt)}</span></td>
              <td><div className={styles.rowActions}>
                {whatsappHref ? <a className={styles.whatsappAction} href={whatsappHref} target="_blank" rel="noreferrer" aria-label={`Open WhatsApp conversation with ${lead.studentName}; this does not confirm delivery`} title="Opens WhatsApp; it does not confirm delivery"><AdminIcon name="whatsapp" size={16} /></a> : null}
                <IconButton label={`Edit ${lead.studentName}`} icon="edit" onClick={() => onEdit(lead)} />
                <Link href={`/adminuser/leads/${lead.id}`} className={styles.rowOpen} aria-label={`View ${lead.studentName} details`} title="View lead details"><AdminIcon name="arrow-up-right" size={15} /></Link>
              </div></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
