"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminSettings } from "@/lib/adminuser/types";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, FieldGrid, Modal, PageHeading, Panel, SelectField, TextField, Toggle } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

export function SettingsPage() {
  const { settings, hydrated, saveSettings, refreshLeads, refreshConsultants, announce } = useAdminData();
  const [draft, setDraft] = useState<AdminSettings>(settings);
  const [showReset, setShowReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  useEffect(() => { if (hydrated) setDraft(settings); }, [hydrated, settings]);
  function update<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) { setSaved(false); setSettingsError(""); setDraft((current) => ({ ...current, [key]: value })); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let parsed: URL;
    try { parsed = new URL(draft.websiteBaseUrl.trim()); }
    catch { setSettingsError("Enter a valid public website URL, including https:// or http://."); return; }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") { setSettingsError("The public website URL must use https:// or http://."); return; }
    saveSettings({ ...draft, websiteBaseUrl: `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}` });
    setSaved(true); setSettingsError("");
  }

  async function handleSync() {
    await Promise.allSettled([refreshLeads(), refreshConsultants()]);
    announce("Synced latest data from database.");
    setShowReset(false);
  }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Configure the workspace settings and synchronize directly with the backend database." actions={<span className={styles.demoOnlyTag}><AdminIcon name="check-circle" size={14} />Connected to PostgreSQL</span>} />
    <form className={styles.settingsForm} onSubmit={submit}>
      <Panel title="Organization & public URL" subtitle="Used to label this workspace and build consultant referral links">
        <FieldGrid>
          <TextField label="Organization name" name="organizationName" value={draft.organizationName} onChange={(event) => update("organizationName", event.target.value)} required />
          <TextField label="Public website URL" name="websiteBaseUrl" type="url" value={draft.websiteBaseUrl} onChange={(event) => update("websiteBaseUrl", event.target.value)} required hint="Referral links use this URL. Public URL defaults to the configured SITE_URL." />
        </FieldGrid>
        {settingsError ? <p className={styles.formError} role="alert">{settingsError}</p> : null}
        <div className={styles.settingsNote}><AdminIcon name="circle-info" size={15} />Referral links are generated with this public base URL plus <code>/?ref=CODE</code>.</div>
      </Panel>
      <Panel title="Lead assignment & referrals" subtitle="Configure referral code options">
        <FieldGrid>
          <SelectField label="Assignment method" name="assignmentMethod" value={draft.assignmentMethod} onChange={(event) => update("assignmentMethod", event.target.value as AdminSettings["assignmentMethod"])} options={[{ value: "Referral-only", label: "Referral Code Only (Direct)" }, { value: "Manual", label: "Manual assignment" }]} hint="Leads filled with a consultant's referral code are automatically assigned to that consultant." />
          <TextField label="Referral code prefix" name="referralCodePrefix" value={draft.referralCodePrefix} onChange={(event) => update("referralCodePrefix", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} placeholder="e.g. ES" hint="Saved as a preference for new consultant codes." />
          <TextField label="Referral attribution cookie (days)" name="referralCookieDays" type="number" min={1} max={365} value={draft.referralCookieDays} onChange={(event) => update("referralCookieDays", Math.max(1, Math.min(365, Number(event.target.value) || 1)))} hint="Visitor referral attribution duration." />
        </FieldGrid>
      </Panel>
      <Panel title="Notification preferences" subtitle="Preferences for administrative alerts">
        <div className={styles.toggleList}>
          <Toggle label="Email notifications" description="Receive notifications for incoming student leads." checked={draft.emailNotifications} onChange={(value) => update("emailNotifications", value)} name="emailNotifications" />
          <Toggle label="Weekly summary" description="Summary report of lead conversions and consultant performance." checked={draft.weeklySummary} onChange={(value) => update("weeklySummary", value)} name="weeklySummary" />
        </div>
      </Panel>
      <div className={styles.formActionRow}><span>{saved ? <><AdminIcon name="check-circle" size={15} />Settings saved</> : "Settings saved to your session."}</span><AdminButton variant="primary" type="submit" icon="save">Save settings</AdminButton></div>
    </form>
    <Panel title="Database Synchronization" subtitle="Force refresh all leads and consultant records from the PostgreSQL database" className={styles.resetPanel}>
      <div className={styles.resetRow}><div><strong>Refresh live database cache</strong><p>Fetch all current leads, consultants, courses and metrics directly from Django REST Framework.</p></div><AdminButton icon="refresh" onClick={() => setShowReset(true)}>Sync database</AdminButton></div>
    </Panel>
    {!hydrated ? <div className={styles.loadingLine}>Loading admin settings…</div> : null}
    {showReset ? <Modal title="Sync database now?" description="Fetch the newest leads, consultants and stats from the backend." onClose={() => setShowReset(false)} footer={<><AdminButton onClick={() => setShowReset(false)}>Cancel</AdminButton><AdminButton variant="primary" icon="refresh" onClick={handleSync}>Sync now</AdminButton></>}><div className={styles.resetConfirm}><AdminIcon name="circle-info" size={18} /><p>This will reload all records directly from Django REST Framework and Neon PostgreSQL.</p></div></Modal> : null}
  </div>;
}
