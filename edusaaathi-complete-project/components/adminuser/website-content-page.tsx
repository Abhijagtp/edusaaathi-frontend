"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { WebsiteContent } from "@/lib/adminuser/types";
import { useAdminData } from "./admin-data-provider";
import { AdminButton, FieldGrid, PageHeading, Panel, TextAreaField, TextField, Toggle } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

export function WebsiteContentPage() {
  const { websiteContent, settings, hydrated, saveWebsiteContent } = useAdminData();
  const [draft, setDraft] = useState<WebsiteContent>(websiteContent);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (hydrated) setDraft(websiteContent); }, [hydrated, websiteContent]);

  function update<K extends keyof WebsiteContent>(key: K, value: WebsiteContent[K]) {
    setSaved(false); setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); saveWebsiteContent(draft); setSaved(true);
  }

  return <div className={styles.pageContent}>
    <PageHeading eyebrow="PUBLIC SITE SETTINGS" title="Website content" description="Configure the demo homepage copy and enquiry form behaviour. These values do not update the public website." actions={<span className={styles.demoOnlyTag}><AdminIcon name="circle-info" size={14} />Frontend demo only</span>} />
    <div className={styles.contentEditorGrid}>
      <form className={styles.contentForm} onSubmit={submit}>
        <Panel title="Homepage content" subtitle="Preview copy for a future CMS integration">
          <div className={styles.formStack}>
            <TextField label="Homepage headline" name="homepageHeading" value={draft.homepageHeading} onChange={(event) => update("homepageHeading", event.target.value)} maxLength={100} required />
            <TextAreaField label="Homepage description" name="homepageDescription" value={draft.homepageDescription} onChange={(event) => update("homepageDescription", event.target.value)} rows={4} maxLength={300} required hint="Keep the message concise; 300 characters maximum." />
          </div>
        </Panel>
        <Panel title="Contact details" subtitle="Contact values are stored in this browser only">
          <FieldGrid>
            <TextField label="Contact email" name="contactEmail" type="email" value={draft.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="hello@example.com" />
            <TextField label="Contact phone" name="contactPhone" type="tel" value={draft.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} placeholder="+91 22 1234 5678" />
            <TextField label="WhatsApp number" name="whatsappNumber" type="tel" value={draft.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} placeholder="+91 98765 43210" hint="Used for future public-site messaging integration." />
          </FieldGrid>
        </Panel>
        <Panel title="Enquiry form options" subtitle="Frontend configuration preview">
          <div className={styles.toggleList}>
            <Toggle label="Enable enquiry form" description="Allow enquiries in a future website integration." checked={draft.enquiryFormEnabled} onChange={(value) => update("enquiryFormEnabled", value)} name="enquiryFormEnabled" />
            <Toggle label="Require consent" description="Require a consent checkbox before submitting the form." checked={draft.requireConsent} onChange={(value) => update("requireConsent", value)} name="requireConsent" />
            <Toggle label="Show course field" description="Include the student's course interest in the enquiry form." checked={draft.showCourseField} onChange={(value) => update("showCourseField", value)} name="showCourseField" />
          </div>
        </Panel>
        <div className={styles.formActionRow}><span>{saved ? <><AdminIcon name="check-circle" size={15} />Saved locally in this browser</> : "Unsaved changes stay on this page until saved."}</span><AdminButton variant="primary" type="submit" icon="save">Save demo content</AdminButton></div>
      </form>
      <aside className={styles.contentPreviewColumn}>
        <div className={styles.previewSticky}>
          <div className={styles.previewLabel}><span><AdminIcon name="eye" size={15} />Content preview</span><BadgeLike /></div>
          <div className={styles.homepagePreview}>
            <span className={styles.previewBrand}><b>ES</b> Edusaaathi</span>
            <span className={styles.previewAccent}>EDUCATION · GUIDANCE · OPPORTUNITY</span>
            <h2>{draft.homepageHeading || "Your homepage headline"}</h2>
            <p>{draft.homepageDescription || "Your homepage description will appear here."}</p>
            <button type="button" disabled={!draft.enquiryFormEnabled}>Get course guidance <AdminIcon name="arrow-right" size={15} /></button>
            <div className={styles.previewContactList}><span><AdminIcon name="mail" size={14} />{draft.contactEmail || "Contact email"}</span><span><AdminIcon name="phone" size={14} />{draft.contactPhone || "Contact phone"}</span></div>
          </div>
          <div className={styles.previewFormCard}><strong>Enquiry form configuration</strong><span>Course field <b>{draft.showCourseField ? "Visible" : "Hidden"}</b></span><span>Consent checkbox <b>{draft.requireConsent ? "Required" : "Optional"}</b></span><span>Public site <b>{settings.websiteBaseUrl}</b></span></div>
          <p className={styles.previewDisclaimer}><AdminIcon name="circle-info" size={14} />Preview only. Changes do not modify the current Edusaaathi public site.</p>
        </div>
      </aside>
    </div>
    {!hydrated ? <div className={styles.loadingLine}>Loading website content settings…</div> : null}
  </div>;
}

function BadgeLike() {
  return <span className={styles.previewDemoBadge}>DEMO</span>;
}
