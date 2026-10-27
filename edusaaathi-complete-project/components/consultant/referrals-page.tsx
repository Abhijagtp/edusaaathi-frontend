"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/adminuser/format";
import { getMyReferralStats } from "@/lib/consultant/mock-service";
import { useConsultantPortal } from "./consultant-provider";
import { EmptyPanel, OutcomeBadge, PageHeader, PortalButton, PortalCard, PortalAvatar, StatusBadge, TableCaption } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import styles from "./consultant.module.css";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back to a temporary selection for a local preview without clipboard permissions.
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  try {
    input.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
  }
}

export function ConsultantReferralsPage() {
  const portal = useConsultantPortal();
  const stats = useMemo(() => getMyReferralStats(portal), [portal.profile, portal.referralLeads]);

  async function copyReferralLink() {
    const copied = await copyText(stats.referralUrl);
    portal.announce(copied ? "Referral link copied to your clipboard." : "Copy failed. Select the referral URL and copy it manually.");
  }

  return <div className={styles.pageStack}>
    <PageHeader eyebrow="LEAD GENERATION" title="My Referral Link" description="Share your unique referral link. A student counts only after submitting an enquiry; visits and clicks are not tracked in this prototype." />
    {!portal.hydrated ? <PortalCard title="Loading referral details"><p className={styles.tableMuted}>Opening your personal referral information…</p></PortalCard> : <>
      <section className={styles.referralHero}>
        <div className={styles.referralCard}>
          <div className={styles.referralHeroIdentity}><PortalAvatar name={portal.profile.fullName} size="md" /><div><strong>{portal.profile.fullName}</strong><small>Personal consultant referral</small></div></div>
          <span className={styles.referralCode}><AdminIcon name="lock" size={13} />Referral code · {portal.profile.referralCode} · read-only</span>
          <div className={styles.referralLinkBox}><code>{stats.referralUrl}</code><div className={styles.referralLinkActions}><PortalButton variant="primary" icon="copy" onClick={() => void copyReferralLink()}>Copy link</PortalButton><a className={styles.actionButton + " " + styles.actionButtonSecondary} href={stats.referralUrl} target="_blank" rel="noreferrer"><AdminIcon name="external" size={14} />Open link</a></div></div>
          <p className={styles.referralExplainer}>The link opens the existing course catalogue with your code in the URL. The public enquiry flow is not connected to capture it in this prototype; the rows below are sample attribution records, and link visits are not measured.</p>
        </div>
        <div className={styles.referralStatsGrid} aria-label="Referral performance summary">
          <div className={styles.referralStatCard}><span>Total leads referred</span><strong>{stats.total}</strong><small>Submitted-enquiry mock records</small></div>
          <div className={styles.referralStatCard}><span>New referral leads</span><strong>{stats.newLeads}</strong><small>Waiting for first contact</small></div>
          <div className={styles.referralStatCard}><span>Converted referral leads</span><strong>{stats.converted}</strong><small>Marked converted in sample data</small></div>
          <div className={styles.referralStatCard}><span>Referral conversion rate</span><strong>{stats.conversionRate}%</strong><small>Converted ÷ referred enquiries</small></div>
        </div>
      </section>

      <PortalCard title="Leads from your referral code" subtitle={`${portal.referralLeads.length} mock enquiry records attributed to ${portal.profile.referralCode}`}>
        {portal.referralLeads.length ? <div className={styles.tableViewport}><table className={styles.dataTable}>
          <TableCaption>Student enquiries attributed to your referral code; detail access is limited to leads assigned to you</TableCaption>
          <thead><tr><th scope="col">Student name</th><th scope="col">Date captured</th><th scope="col">Interested course</th><th scope="col">Current status</th><th scope="col">Conversion outcome</th><th scope="col">Access</th></tr></thead>
          <tbody>{portal.referralLeads.map((lead) => <tr key={lead.id}>
            <td><div className={styles.personCell}><PortalAvatar name={lead.fullName} size="sm" /><span><strong>{lead.fullName}</strong><small>Referral submitted</small></span></div></td>
            <td>{formatDate(lead.capturedAt, { day: "numeric", month: "short", year: "numeric" })}</td>
            <td>{lead.interestedCourse}</td>
            <td><StatusBadge status={lead.currentStatus} /></td>
            <td><OutcomeBadge status={lead.currentStatus} /></td>
            <td>{lead.authorizedLeadId ? <Link className={styles.tableLink} href={`/consultant/leads/${lead.authorizedLeadId}`}>Open assigned lead <AdminIcon name="arrow-up-right" size={12} /></Link> : <span className={styles.tableMuted}>Not assigned to you</span>}</td>
          </tr>)}</tbody>
        </table></div> : <EmptyPanel title="No referral enquiries yet" description="When a student submits an enquiry using your referral code, the captured lead will appear here." icon="link" />}
        <p className={styles.attributionNotice}><AdminIcon name="lock" size={14} />Referral ownership is read-only. The detail link appears only for records assigned to your consultant account; server-side permissions are required in production.</p>
      </PortalCard>
    </>}
  </div>;
}
