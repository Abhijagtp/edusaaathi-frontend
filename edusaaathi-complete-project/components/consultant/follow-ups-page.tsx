"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/adminuser/format";
import { consultantLocalDate, getConsultantPhoneHref, getConsultantWhatsAppHref, getMyFollowUps } from "@/lib/consultant/mock-service";
import type { ConsultantFollowUp } from "@/lib/consultant/types";
import { useConsultantPortal } from "./consultant-provider";
import { FollowUpDialog } from "./consultant-dialogs";
import { EmptyPanel, IconAction, PageHeader, PortalButton, PortalCard, PortalAvatar, StatusBadge, FollowUpBadge, TableCaption } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

type FollowUpTab = "Overdue" | "Today" | "Upcoming" | "Completed";
const tabs: FollowUpTab[] = ["Overdue", "Today", "Upcoming", "Completed"];

export function ConsultantFollowUpsPage() {
  const portal = useConsultantPortal();
  const allFollowUps = useMemo(() => getMyFollowUps(portal), [portal.followUps, portal.leads, portal.profile.id]);
  const [tab, setTab] = useState<FollowUpTab>("Overdue");
  const [search, setSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState("All lead statuses");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingFollowUp, setEditingFollowUp] = useState<ConsultantFollowUp | undefined>();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const today = consultantLocalDate(new Date());

  const counts = useMemo(() => {
    const pending = allFollowUps.filter((item) => item.status === "Pending");
    return {
      Overdue: pending.filter((item) => consultantLocalDate(item.scheduledAt) < today).length,
      Today: pending.filter((item) => consultantLocalDate(item.scheduledAt) === today).length,
      Upcoming: pending.filter((item) => consultantLocalDate(item.scheduledAt) > today).length,
      Completed: allFollowUps.filter((item) => item.status === "Completed").length,
    };
  }, [allFollowUps, today]);

  const rows = useMemo(() => allFollowUps.filter((item) => {
    const lead = portal.leads.find((candidate) => candidate.id === item.leadId);
    if (!lead) return false;
    const scheduledDate = consultantLocalDate(item.scheduledAt);
    const matchesTab = tab === "Completed" ? item.status === "Completed"
      : item.status === "Pending" && (tab === "Overdue" ? scheduledDate < today : tab === "Today" ? scheduledDate === today : scheduledDate > today);
    const matchesSearch = !search.trim() || lead.fullName.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = leadStatus === "All lead statuses" || lead.status === leadStatus;
    const matchesFrom = !fromDate || scheduledDate >= fromDate;
    const matchesTo = !toDate || scheduledDate <= toDate;
    return matchesTab && matchesSearch && matchesStatus && matchesFrom && matchesTo;
  }).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)), [allFollowUps, portal.leads, tab, today, search, leadStatus, fromDate, toDate]);

  function complete(item: ConsultantFollowUp) {
    if (item.status !== "Pending") return;
    portal.completeFollowUp(item.id);
  }

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="STUDENT MANAGEMENT" title="Follow-ups" description="Keep your student conversations organized. Overdue items stay visible until you complete or reschedule them." actions={<PortalButton variant="primary" icon="plus" onClick={() => setScheduleOpen(true)} disabled={!portal.hydrated || !portal.leads.length}>Schedule follow-up</PortalButton>} />
    {!portal.hydrated ? <PortalCard title="My follow-up queue"><p className={styles.tableMuted} role="status">Loading your follow-ups…</p></PortalCard> : <PortalCard title="My follow-up queue" subtitle={`${rows.length} ${tab.toLowerCase()} item${rows.length === 1 ? "" : "s"}`}>
      <div className={styles.followupTabs} role="group" aria-label="Filter follow-ups by timing">
        {tabs.map((item) => <button type="button" key={item} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}<span>{counts[item]}</span></button>)}
      </div>
      <div className={styles.tableToolbar}>
        <div className={styles.filterGroup}>
          <label className={styles.searchField}><AdminIcon name="search" size={15} /><span className={styles.srOnly}>Search by student name</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student name" /></label>
          <label className={styles.filterControl}><span className={styles.srOnly}>Filter by student lead status</span><select value={leadStatus} onChange={(event) => setLeadStatus(event.target.value)}><option>All lead statuses</option>{["New", "Contacted", "Follow-up", "Converted", "Lost"].map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
        <div className={styles.filterGroup}><label className={styles.dateFilter}><span>From</span><input type="date" aria-label="Scheduled on or after" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></label><label className={styles.dateFilter}><span>To</span><input type="date" aria-label="Scheduled on or before" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label></div>
      </div>
      {rows.length ? <div className={styles.tableViewport}><table className={styles.dataTable}>
        <TableCaption>Consultant follow-up schedule for assigned student leads</TableCaption>
        <thead><tr><th scope="col">Student</th><th scope="col">Phone</th><th scope="col">Scheduled date</th><th scope="col">Time</th><th scope="col">Follow-up note</th><th scope="col">Lead status</th><th scope="col">Follow-up state</th><th scope="col">Actions</th></tr></thead>
        <tbody>{rows.map((item) => {
          const lead = portal.leads.find((candidate) => candidate.id === item.leadId);
          if (!lead) return null;
          const wa = getConsultantWhatsAppHref(lead.phone, lead.fullName, lead.interestedCourse, portal.profile.fullName);
          const phone = getConsultantPhoneHref(lead.phone);
          const overdue = item.status === "Pending" && consultantLocalDate(item.scheduledAt) < today;
          return <tr className={overdue ? styles.rowOverdue : ""} key={item.id}>
            <td><div className={styles.personCell}><PortalAvatar name={lead.fullName} size="sm" /><span><strong>{lead.fullName}</strong><small>{lead.interestedCourse}</small></span></div></td>
            <td>{phone ? <a className={styles.tableLink} href={phone}>{lead.phone}</a> : <span className={styles.tableMuted}>{lead.phone}</span>}</td>
            <td><span className={styles.tableMainText}>{formatDate(item.scheduledAt, { day: "numeric", month: "short", year: "numeric" })}</span>{overdue ? <span className={styles.tableSubText}>Overdue</span> : null}</td>
            <td>{formatTime(item.scheduledAt)}</td>
            <td><span className={styles.tableMainText}>{item.note}</span></td>
            <td><StatusBadge status={lead.status} /></td><td><FollowUpBadge completed={item.status === "Completed"} /></td>
            <td><div className={styles.rowActionGroup}><IconAction label={`Open ${lead.fullName}'s lead`} icon="eye" href={`/consultant/leads/${lead.id}`} />{wa ? <IconAction label={`Open WhatsApp with ${lead.fullName}; delivery is not confirmed`} icon="whatsapp" href={wa} target="_blank" tone="whatsapp" /> : null}{item.status === "Pending" ? <><IconAction label="Reschedule follow-up" icon="edit" onClick={() => setEditingFollowUp(item)} /><IconAction label="Mark follow-up complete" icon="check" onClick={() => complete(item)} /></> : null}</div></td>
          </tr>;
        })}</tbody>
      </table></div> : <EmptyPanel title={`No ${tab.toLowerCase()} follow-ups`} description={tab === "Overdue" ? "There are no overdue follow-ups in your assigned queue." : "Schedule a touchpoint for one of your assigned leads to keep the conversation moving."} icon="calendar" action={tab !== "Completed" ? <PortalButton variant="primary" icon="plus" onClick={() => setScheduleOpen(true)} disabled={!portal.leads.length}>Schedule follow-up</PortalButton> : undefined} />}
    </PortalCard>}
    {scheduleOpen ? <FollowUpDialog leads={portal.leads} onClose={() => setScheduleOpen(false)} onSave={(draft) => portal.createFollowUp(draft)} /> : null}
    {editingFollowUp ? <FollowUpDialog leads={portal.leads} followUp={editingFollowUp} onClose={() => setEditingFollowUp(undefined)} onSave={(draft) => portal.updateFollowUp(editingFollowUp.id, draft)} /> : null}
  </div>;
}
