"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Consultant, ConsultantDraft } from "@/lib/adminuser/types";
import { getReferralUrl } from "@/lib/adminuser/mock-data";
import { formatDate, percent } from "@/lib/adminuser/format";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, Avatar, Badge, EmptyState, FieldGrid, Modal, PageHeading, Panel, SearchField, SelectField, TextField } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

function suggestedCode(name: string, existing: Consultant[]) {
  const prefix = name.trim().split(/\s+/)[0]?.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 6) || "TEAM";
  let suffix = existing.length + 1;
  let code = `${prefix}${String(suffix).padStart(2, "0")}`;
  while (existing.some((consultant) => consultant.referralCode.toLowerCase() === code.toLowerCase())) {
    suffix += 1;
    code = `${prefix}${String(suffix).padStart(2, "0")}`;
  }
  return code;
}

function ConsultantDialog({ consultant, consultants, onClose, onSave }: { consultant?: Consultant; consultants: Consultant[]; onClose: () => void; onSave: (draft: ConsultantDraft) => void }) {
  const [draft, setDraft] = useState<ConsultantDraft>(() => consultant ? { id: consultant.id, name: consultant.name, email: consultant.email, phone: consultant.phone, referralCode: consultant.referralCode, status: consultant.status } : { name: "", email: "", phone: "", referralCode: "", status: "Active" });
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const finalDraft = { ...draft, referralCode: draft.referralCode.trim().toUpperCase() || suggestedCode(draft.name, consultants) };
    try { onSave(finalDraft); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Consultant could not be saved."); }
  }
  return <Modal title={consultant ? "Edit consultant" : "Add consultant"} description="Each consultant gets a unique referral code. Inactive accounts keep their attribution history." onClose={onClose} footer={<><AdminButton onClick={onClose}>Cancel</AdminButton><AdminButton variant="primary" type="submit" form="consultant-editor">{consultant ? "Save changes" : "Add consultant"}</AdminButton></>}>
    <form id="consultant-editor" onSubmit={submit} className={styles.formStack}><FieldGrid>
      <TextField label="Full name" name="name" value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} required placeholder="e.g. Aditi Shah" />
      <TextField label="Email" name="email" type="email" value={draft.email} onChange={(event) => setDraft((value) => ({ ...value, email: event.target.value }))} required placeholder="name@edusathi.example" />
      <TextField label="Phone" name="phone" type="tel" value={draft.phone} onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))} required placeholder="+91 98765 43210" />
      <TextField label="Referral code" name="referralCode" value={draft.referralCode} onChange={(event) => setDraft((value) => ({ ...value, referralCode: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} hint="Letters and numbers only. Leave blank to generate a unique code." placeholder="ADITI02" />
      <SelectField label="Account status" name="status" value={draft.status} onChange={(event) => setDraft((value) => ({ ...value, status: event.target.value as Consultant["status"] }))} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
    </FieldGrid>{error ? <p className={styles.formError} role="alert">{error}</p> : null}</form>
  </Modal>;
}

function ConsultantDetailDialog({ consultant, leads, referrals, baseUrl, onClose }: { consultant: Consultant; leads: ReturnType<typeof useAdminData>["leads"]; referrals: ReturnType<typeof useAdminData>["referrals"]; baseUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const assigned = leads.filter((lead) => lead.assignedConsultantId === consultant.id);
  const referred = leads.filter((lead) => lead.referredByConsultantId === consultant.id);
  const converted = assigned.filter((lead) => lead.status === "Converted").length;
  const referralRecords = referrals.filter((referral) => referral.consultantId === consultant.id).length;
  const referralLink = getReferralUrl(baseUrl, consultant.referralCode);
  async function copyLink() {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  }
  return <Modal title={consultant.name} description="Consultant profile and referral performance." onClose={onClose} size="lg" footer={<AdminButton onClick={onClose}>Close</AdminButton>}>
    <div className={styles.consultantDetailTop}><Avatar name={consultant.name} size="lg" /><div><Badge dot>{consultant.status}</Badge><p>{consultant.email} · {consultant.phone}</p></div></div>
    <div className={styles.miniStatsGrid}><div><span>Assigned leads</span><strong>{assigned.length}</strong></div><div><span>Referral leads</span><strong>{referred.length}</strong></div><div><span>Converted</span><strong>{converted}</strong></div><div><span>Conversion rate</span><strong>{percent(converted, assigned.length)}</strong></div></div>
    <div className={styles.referralCodeBox}><span>Unique referral link</span><code>{referralLink}</code><AdminButton icon={copied ? "check" : "copy"} onClick={() => void copyLink()}>{copied ? "Copied" : "Copy link"}</AdminButton></div>
    <p className={styles.helperInfo}><AdminIcon name="circle-info" size={14} />{referralRecords} attribution record{referralRecords === 1 ? "" : "s"}. Referral attribution is separate from current lead ownership; deactivation does not delete history.</p>
    <div className={styles.consultantRecentLeads}><strong>Recent referral leads</strong>{referred.slice(0, 4).map((lead) => <Link href={`/adminuser/leads/${lead.id}`} key={lead.id} onClick={onClose}><Avatar name={lead.studentName} size="xs" /><span>{lead.studentName}<small>{lead.course} · {lead.status}</small></span><AdminIcon name="arrow-up-right" size={14} /></Link>)}{!referred.length ? <small>No referral leads yet.</small> : null}</div>
    <div className={styles.referralCodeBox}><span>Referral link clicks (mock count)</span><strong>{consultant.referralClicks.toLocaleString("en-IN")}</strong></div>
  </Modal>;
}

export function ConsultantsPage() {
  const { consultants, leads, referrals, settings, addConsultant, updateConsultant, setConsultantStatus, hydrated } = useAdminData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All accounts");
  const [copiedCode, setCopiedCode] = useState("");
  const [editing, setEditing] = useState<Consultant | undefined>();
  const [showEditor, setShowEditor] = useState(false);
  const [viewing, setViewing] = useState<Consultant | undefined>();
  const filtered = useMemo(() => consultants.filter((consultant) => {
    const searchText = `${consultant.name} ${consultant.email} ${consultant.phone} ${consultant.referralCode}`.toLowerCase();
    return (statusFilter === "All accounts" || consultant.status === statusFilter) && (!search.trim() || searchText.includes(search.trim().toLowerCase()));
  }), [consultants, statusFilter, search]);
  const activeCount = consultants.filter((item) => item.status === "Active").length;
  const assignedCount = leads.filter((lead) => lead.assignedConsultantId).length;
  const converted = leads.filter((lead) => lead.status === "Converted").length;

  function save(draft: ConsultantDraft) {
    if (draft.id) updateConsultant(draft.id, draft);
    else addConsultant(draft);
    setShowEditor(false);
    setEditing(undefined);
  }

  async function copyReferralLink(id: string, url: string) {
    try {
      if (!navigator.clipboard) return;
      await navigator.clipboard.writeText(url);
      setCopiedCode(id);
      window.setTimeout(() => setCopiedCode(""), 1800);
    } catch {
      setCopiedCode("");
    }
  }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="TEAM MANAGEMENT" title="Consultants" description="Manage your consultant team, their referral codes and lead ownership." actions={<AdminButton variant="primary" icon="plus" onClick={() => { setEditing(undefined); setShowEditor(true); }}>Add consultant</AdminButton>} />
    <div className={styles.threeStatsGrid}><div className={styles.summaryStat}><span>Consultants</span><strong>{consultants.length}</strong><small>{activeCount} active accounts</small></div><div className={styles.summaryStat}><span>Assigned leads</span><strong>{assignedCount}</strong><small>Across the current mock data</small></div><div className={styles.summaryStat}><span>Team conversions</span><strong>{converted}</strong><small>{percent(converted, leads.length)} of all leads</small></div></div>
    <Panel title="Consultant directory" subtitle={`${filtered.length} consultants`} action={<div className={styles.panelFilters}><SearchField value={search} onChange={setSearch} placeholder="Search name or code" label="Search consultants" /><label className={styles.filterControl}><span className={styles.srOnly}>Filter account status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All accounts</option><option>Active</option><option>Inactive</option></select></label></div>}>
      {!hydrated ? <div className={styles.tableLoading}>Loading consultant data…</div> : filtered.length ? <div className={styles.tableViewport}><table className={styles.dataTable}><thead><tr><th>Consultant</th><th>Contact</th><th>Referral code</th><th>Status</th><th>Assigned leads</th><th>Converted</th><th>Conversion rate</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{filtered.map((consultant) => {
        const assigned = leads.filter((lead) => lead.assignedConsultantId === consultant.id);
        const referralsForConsultant = leads.filter((lead) => lead.referredByConsultantId === consultant.id);
        const convertedLeads = assigned.filter((lead) => lead.status === "Converted").length;
        const url = getReferralUrl(settings.websiteBaseUrl, consultant.referralCode);
        return <tr key={consultant.id}><td><div className={styles.studentCell}><Avatar name={consultant.name} size="sm" /><span><strong className={styles.studentName}>{consultant.name}</strong><small>{referralsForConsultant.length} referral leads</small></span></div></td><td><span className={styles.contactStack}>{consultant.email}<small>{consultant.phone}</small></span></td><td><button type="button" className={styles.codeCopy} title={`Copy referral link for ${consultant.name}`} aria-label={`Copy referral link for ${consultant.name}`} onClick={() => void copyReferralLink(consultant.id, url)}><code>{consultant.referralCode}</code><AdminIcon name={copiedCode === consultant.id ? "check" : "copy"} size={13} /></button></td><td><Badge dot>{consultant.status}</Badge></td><td>{assigned.length}</td><td>{convertedLeads}</td><td><span className={styles.rateCell}>{percent(convertedLeads, assigned.length)}</span></td><td>{formatDate(consultant.createdAt)}</td><td><div className={styles.rowActions}><button type="button" className={styles.rowTextAction} onClick={() => setViewing(consultant)}>View</button><button type="button" className={styles.rowTextAction} onClick={() => { setEditing(consultant); setShowEditor(true); }}>Edit</button><button type="button" className={`${styles.rowTextAction} ${consultant.status === "Active" ? styles.rowActionDanger : styles.rowActionSuccess}`} onClick={() => setConsultantStatus(consultant.id, consultant.status === "Active" ? "Inactive" : "Active")}>{consultant.status === "Active" ? "Deactivate" : "Activate"}</button></div></td></tr>;
      })}</tbody></table></div> : <EmptyState title="No consultants found" description="Try another search or add a consultant to the team." icon="users" action={<AdminButton variant="primary" icon="plus" onClick={() => { setEditing(undefined); setShowEditor(true); }}>Add consultant</AdminButton>} />}
    </Panel>
    <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} />Consultant changes are stored locally in this demo. Deactivating a consultant preserves assigned and referred lead history.</p>
    {showEditor ? <ConsultantDialog consultant={editing} consultants={consultants} onClose={() => { setShowEditor(false); setEditing(undefined); }} onSave={save} /> : null}
    {viewing ? <ConsultantDetailDialog consultant={viewing} leads={leads} referrals={referrals} baseUrl={settings.websiteBaseUrl} onClose={() => setViewing(undefined)} /> : null}
  </div>;
}
