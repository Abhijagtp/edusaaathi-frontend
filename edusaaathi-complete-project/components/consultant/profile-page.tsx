"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatDate } from "@/lib/adminuser/format";
import type { ConsultantProfileDraft } from "@/lib/consultant/types";
import { useConsultantPortal } from "./consultant-provider";
import { PageHeader, PortalButton, PortalCard, PortalAvatar, FormInput } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

export function ConsultantProfilePage() {
  const portal = useConsultantPortal();
  const [draft, setDraft] = useState<ConsultantProfileDraft>({ fullName: portal.profile.fullName, email: portal.profile.email, phone: portal.profile.phone });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft({ fullName: portal.profile.fullName, email: portal.profile.email, phone: portal.profile.phone });
  }, [portal.profile.fullName, portal.profile.email, portal.profile.phone]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      portal.updateMyProfile(draft);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profile changes could not be saved.");
    }
  }

  function cancel() {
    setDraft({ fullName: portal.profile.fullName, email: portal.profile.email, phone: portal.profile.phone });
    setError("");
    setSaved(false);
  }

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="ACCOUNT" title="My Profile" description="Manage your consultant contact details. Your role, access, account status and referral attribution are fixed in this prototype." />
    {!portal.hydrated ? <PortalCard title="Loading profile"><p className={styles.tableMuted}>Opening your browser-local profile…</p></PortalCard> : <>
    <div className={styles.profileLayout}>
      <PortalCard title="Consultant account" subtitle="Your demo workspace profile">
        <div className={styles.profileSummary}>
          <PortalAvatar name={portal.profile.fullName} size="lg" />
          <strong>{portal.profile.fullName}</strong>
          <small>Education consultant · Mock account</small>
          <div className={styles.profileSummaryMeta}>
            <div><span>Account status</span><strong>{portal.profile.isActive ? "Active" : "Inactive"}</strong></div>
            <div><span>Date joined</span><strong>{formatDate(portal.profile.createdAt, { day: "numeric", month: "short", year: "numeric" })}</strong></div>
          </div>
        </div>
      </PortalCard>
      <PortalCard title="Contact information" subtitle="Only these personal fields can be edited in this mock">
        <form className={styles.formStack} onSubmit={submit}>
          <div className={styles.formGrid}>
            <FormInput label="Full name" name="consultant-name" value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} maxLength={80} autoComplete="name" required />
            <FormInput label="Email address" name="consultant-email" type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} maxLength={160} autoComplete="email" required />
            <FormInput label="Phone number" name="consultant-phone" type="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} maxLength={24} autoComplete="tel" pattern="[+0-9 ()-]{10,24}" required hint="Use your Indian mobile number, including +91 if preferred." />
          </div>
          <div className={styles.formGrid}>
            <div className={styles.readonlyField}><span>Referral code · read-only</span><div className={styles.readonlyValue}><strong>{portal.profile.referralCode}</strong><AdminIcon name="lock" size={14} /></div></div>
            <div className={styles.readonlyField}><span>Role and permissions · read-only</span><div className={styles.readonlyValue}><strong>Consultant</strong><small>Managed by the platform</small></div></div>
          </div>
          {error ? <p className={styles.formError} role="alert">{error}</p> : null}
          {saved ? <p className={styles.formSuccess} role="status">Profile saved in this browser. No backend profile was changed.</p> : null}
          <div className={styles.formActions}><PortalButton type="button" onClick={cancel}>Cancel</PortalButton><PortalButton variant="primary" icon="save" type="submit">Save changes</PortalButton></div>
        </form>
      </PortalCard>
    </div>
    <PortalCard title="Account controls" subtitle="Sensitive account settings are not available in this frontend demo">
      <p className={styles.accountNote}><AdminIcon name="lock" size={16} />Role, permissions, account status, referral code, and original referral ownership cannot be changed here. No password-management or authentication flow has been added; production account controls should use the existing Django-authenticated mechanism.</p>
    </PortalCard>
    </>}
  </div>;
}
