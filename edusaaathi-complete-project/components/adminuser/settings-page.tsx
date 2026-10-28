"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminSettings } from "@/lib/adminuser/types";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, FieldGrid, Modal, PageHeading, Panel, SelectField, TextField, Toggle } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

export function SettingsPage() {
  const { settings, hydrated, saveSettings, resetMockData } = useAdminData();
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

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="WORKSPACE CONFIGURATION" title="Settings" description="Configure the frontend demo workspace. These values are stored locally and do not enforce security or send notifications." actions={<span className={styles.demoOnlyTag}><AdminIcon name="lock" size={14} />No backend connected</span>} />
    <form className={styles.settingsForm} onSubmit={submit}>
      <Panel title="Organization & public URL" subtitle="Used to label this workspace and build consultant referral links">
        <FieldGrid>
          <TextField label="Organization name" name="organizationName" value={draft.organizationName} onChange={(event) => update("organizationName", event.target.value)} required />
          <TextField label="Public website URL" name="websiteBaseUrl" type="url" value={draft.websiteBaseUrl} onChange={(event) => update("websiteBaseUrl", event.target.value)} required hint="Referral links use this URL. Public URL defaults to the configured SITE_URL." />
        </FieldGrid>
        {settingsError ? <p className={styles.formError} role="alert">{settingsError}</p> : null}
        <div className={styles.settingsNote}><AdminIcon name="circle-info" size={15} />Referral links are generated with this public base URL plus <code>/apply?ref=CODE</code>. The preview does not track clicks.</div>
      </Panel>
      <Panel title="Lead assignment & referrals" subtitle="These options are configuration previews only">
        <FieldGrid>
          <SelectField label="Assignment method" name="assignmentMethod" value={draft.assignmentMethod} onChange={(event) => update("assignmentMethod", event.target.value as AdminSettings["assignmentMethod"])} options={[{ value: "Manual", label: "Manual assignment" }, { value: "Round robin", label: "Round robin (future integration)" }, { value: "Fewest open leads", label: "Fewest open leads (future integration)" }]} hint="Changing this setting does not automatically assign leads in this frontend." />
          <TextField label="Referral code prefix" name="referralCodePrefix" value={draft.referralCodePrefix} onChange={(event) => update("referralCodePrefix", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12))} placeholder="e.g. ES" hint="Saved as a preference; existing referral codes are unchanged." />
          <TextField label="Referral attribution cookie (days)" name="referralCookieDays" type="number" min={1} max={365} value={draft.referralCookieDays} onChange={(event) => update("referralCookieDays", Math.max(1, Math.min(365, Number(event.target.value) || 1)))} hint="Mock setting; no browser referral cookie is created." />
        </FieldGrid>
      </Panel>
      <Panel title="Notification preferences" subtitle="Preferences are saved locally; no emails or reminders are sent">
        <div className={styles.toggleList}>
          <Toggle label="Email notifications" description="Future preference for important admin updates." checked={draft.emailNotifications} onChange={(value) => update("emailNotifications", value)} name="emailNotifications" />
          <Toggle label="Weekly summary" description="Future preference for a weekly performance summary." checked={draft.weeklySummary} onChange={(value) => update("weeklySummary", value)} name="weeklySummary" />
        </div>
      </Panel>
      <div className={styles.formActionRow}><span>{saved ? <><AdminIcon name="check-circle" size={15} />Settings saved in this browser</> : "Settings are local to this browser."}</span><AdminButton variant="primary" type="submit" icon="save">Save settings</AdminButton></div>
    </form>
    <Panel title="Demo data" subtitle="This clears browser-local changes and restores the illustrative sample dataset" className={styles.resetPanel}>
      <div className={styles.resetRow}><div><strong>Reset admin demo data</strong><p>Reset leads, consultants, referrals, website content and preferences to the original sample values in this browser.</p></div><AdminButton variant="danger" icon="refresh" onClick={() => setShowReset(true)}>Reset demo data</AdminButton></div>
    </Panel>
    <div className={styles.securityNotice}><span><AdminIcon name="lock" size={18} /></span><div><strong>Production security is not implemented here.</strong><p>This admin panel is a frontend-only prototype. Enforce authentication, authorization, audit logging and all data writes in the Django backend before exposing it to real users. Keep the existing <code>/admin</code> authentication flow separate.</p></div></div>
    {!hydrated ? <div className={styles.loadingLine}>Loading admin settings…</div> : null}
    {showReset ? <Modal title="Reset demo data?" description="This will replace the current browser-local mock changes with the original sample dataset." onClose={() => setShowReset(false)} footer={<><AdminButton onClick={() => setShowReset(false)}>Keep my data</AdminButton><AdminButton variant="danger" icon="refresh" onClick={() => { resetMockData(); setShowReset(false); setSaved(false); }}>Reset demo data</AdminButton></>}><div className={styles.resetConfirm}><AdminIcon name="circle-info" size={18} /><p>This action only affects this browser's local demo. It does not contact or delete anything from a server.</p></div></Modal> : null}
  </div>;
}
