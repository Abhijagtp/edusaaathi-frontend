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

function ConsultantDialog({ consultant, consultants, onClose, onSave }: { consultant?: Consultant; consultants: Consultant[]; onClose: () => void; onSave: (draft: ConsultantDraft) => Promise<void> | void }) {
  const [draft, setDraft] = useState<ConsultantDraft>(() => consultant ? { id: consultant.id, name: consultant.name, email: consultant.email, phone: consultant.phone, referralCode: consultant.referralCode, status: consultant.status } : { name: "", email: "", phone: "", referralCode: "", status: "Active", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const finalDraft = { ...draft, referralCode: draft.referralCode.trim().toUpperCase() || suggestedCode(draft.name, consultants) };
    try {
      setSaving(true);
      await onSave(finalDraft);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Consultant could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return <Modal title={consultant ? "Edit consultant" : "Add consultant"} description="Provision consultant account and generate unique referral code. Consultants use this account to log in to the Consultant Portal." onClose={onClose} footer={<><AdminButton onClick={onClose} disabled={saving}>Cancel</AdminButton><AdminButton variant="primary" type="submit" form="consultant-editor" disabled={saving}>{saving ? "Saving…" : consultant ? "Save changes" : "Create consultant account"}</AdminButton></>}>
    <form id="consultant-editor" onSubmit={submit} className={styles.formStack}><FieldGrid>
      <TextField label="Full name" name="name" value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} required placeholder="e.g. Aditi Shah" />
      <TextField label="Email address" name="email" type="email" value={draft.email} onChange={(event) => setDraft((value) => ({ ...value, email: event.target.value }))} required placeholder="aditi@example.com" hint="Used as login username for the Consultant Portal." />
      <TextField label="Phone number" name="phone" type="tel" value={draft.phone} onChange={(event) => setDraft((value) => ({ ...value, phone: event.target.value }))} required placeholder="+91 98765 43210" />
      <TextField label="Login password" name="password" type="text" value={draft.password || ""} onChange={(event) => setDraft((value) => ({ ...value, password: event.target.value }))} placeholder={consultant ? "Leave blank to keep current password" : "e.g. Consultant@2026 (or auto-generate)"} hint={consultant ? "Leave blank to keep unchanged." : "Password used by the consultant to log in at /admin/login."} />
      <TextField label="Referral code" name="referralCode" value={draft.referralCode} onChange={(event) => setDraft((value) => ({ ...value, referralCode: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))} hint="Letters and numbers only. Leave blank to auto-generate." placeholder="ADITI02" />
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
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password?: string;
    referralCode: string;
    loginUrl: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const filtered = useMemo(() => consultants.filter((consultant) => {
    const searchText = `${consultant.name} ${consultant.email} ${consultant.phone} ${consultant.referralCode}`.toLowerCase();
    return (statusFilter === "All accounts" || consultant.status === statusFilter) && (!search.trim() || searchText.includes(search.trim().toLowerCase()));
  }), [consultants, statusFilter, search]);
  const activeCount = consultants.filter((item) => item.status === "Active").length;
  const assignedCount = leads.filter((lead) => lead.assignedConsultantId).length;
  const converted = leads.filter((lead) => lead.status === "Converted").length;

  async function save(draft: ConsultantDraft) {
    if (draft.id) {
      updateConsultant(draft.id, draft);
      setShowEditor(false);
      setEditing(undefined);
    } else {
      const res = await addConsultant(draft);
      setShowEditor(false);
      setEditing(undefined);
      const effectivePassword = res?.initialPassword || draft.password;
      if (effectivePassword) {
        setCreatedCredentials({
          name: draft.name,
          email: draft.email,
          password: effectivePassword,
          referralCode: draft.referralCode,
          loginUrl: `${window.location.origin}/admin/login`,
        });
      }
    }
  }

  async function copyCredentialsText() {
    if (!createdCredentials) return;
    const text = `EduSaathi Consultant Login Credentials:\nName: ${createdCredentials.name}\nLogin URL: ${createdCredentials.loginUrl}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password || "Provided during setup"}\nReferral Code: ${createdCredentials.referralCode}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } catch {
      setCopiedCreds(false);
    }
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
    <p className={styles.pageFootnote}><AdminIcon name="circle-info" size={15} />Consultant accounts sync directly to Django backend and Neon PostgreSQL. Deactivating a consultant preserves lead history.</p>
    {showEditor ? <ConsultantDialog consultant={editing} consultants={consultants} onClose={() => { setShowEditor(false); setEditing(undefined); }} onSave={save} /> : null}
    {viewing ? <ConsultantDetailDialog consultant={viewing} leads={leads} referrals={referrals} baseUrl={settings.websiteBaseUrl} onClose={() => setViewing(undefined)} /> : null}

    {createdCredentials ? (
      <Modal
        title="Consultant Account Created"
        description="Share these login credentials with the consultant. When they sign in, they will be automatically directed to their dedicated Consultant Portal."
        onClose={() => setCreatedCredentials(null)}
        footer={
          <>
            <AdminButton onClick={() => setCreatedCredentials(null)}>Close</AdminButton>
            <AdminButton variant="primary" icon={copiedCreds ? "check" : "copy"} onClick={copyCredentialsText}>
              {copiedCreds ? "Credentials copied!" : "Copy all credentials"}
            </AdminButton>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "8px 0" }}>
          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#64748b" }}>Login Portal URL</p>
            <code style={{ fontSize: "0.95rem", color: "#1e293b", fontWeight: 600 }}>{createdCredentials.loginUrl}</code>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "0.8rem", color: "#64748b" }}>Email / Username</p>
              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{createdCredentials.email}</strong>
            </div>
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 4px 0", fontSize: "0.8rem", color: "#64748b" }}>Password</p>
              <code style={{ fontSize: "1rem", color: "#5146dc", fontWeight: 700 }}>{createdCredentials.password || "—"}</code>
            </div>
          </div>
          <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 4px 0", fontSize: "0.8rem", color: "#64748b" }}>Assigned Referral Code</p>
            <code style={{ fontSize: "0.95rem", color: "#059669", fontWeight: 700 }}>{createdCredentials.referralCode}</code>
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
            <AdminIcon name="circle-info" size={14} /> When this user logs in at <code>/admin/login</code>, our authentication system detects their <strong>CONSULTANT</strong> role and automatically opens the <strong>Consultant Workspace</strong> (not the Admin panel).
          </p>
        </div>
      </Modal>
    ) : null}
  </div>;
}
