"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/adminuser/format";
import { SITE_URL } from "@/lib/config";
import { useConsultantPortal } from "./consultant-provider";
import { EmptyPanel, OutcomeBadge, PageHeader, PortalButton, PortalCard, PortalAvatar, StatusBadge, TableCaption } from "./consultant-ui";
import { AdminIcon } from "@/components/adminuser/admin-icon";
import type { ConsultantLeadStatus } from "@/lib/consultant/types";
import styles from "./consultant.module.css";

type DestinationType = "courses" | "home" | "apply";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall back to a temporary textarea
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
  const [origin, setOrigin] = useState<string>(SITE_URL || "http://localhost:3000");
  const [destination, setDestination] = useState<DestinationType>("courses");
  const [copiedTarget, setCopiedTarget] = useState<"link" | "code" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dynamically resolve client-side browser host
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralCode = portal.profile.referralCode || "CONSULTANT";

  // Dynamically generated destination URLs
  const urls: Record<DestinationType, { label: string; desc: string; url: string }> = useMemo(() => {
    const encoded = encodeURIComponent(referralCode);
    return {
      courses: {
        label: "Course Catalogue",
        desc: "Directs students to browse all university degrees with your referral tag",
        url: `${origin}/courses?ref=${encoded}`,
      },
      home: {
        label: "Home Page",
        desc: "Directs students to the main Edusaaathi homepage with your referral tag",
        url: `${origin}/?ref=${encoded}`,
      },
      apply: {
        label: "Direct Application",
        desc: "Takes prospective students straight to the admission enquiry form",
        url: `${origin}/?ref=${encoded}#enquiry-form`,
      },
    };
  }, [origin, referralCode]);

  const activeLink = urls[destination].url;

  // Social share links
  const waShareText = `Hi! Explore top university degrees & courses with personalized admission guidance on Edusaaathi: ${activeLink} (Referral Code: ${referralCode})`;
  const waShareHref = `https://wa.me/?text=${encodeURIComponent(waShareText)}`;

  const emailShareSubject = `Recommended Higher Education Programs · Edusaaathi`;
  const emailShareBody = `Hi,\n\nI invite you to explore accredited university degree programs with dedicated career counseling on Edusaaathi.\n\nExplore programs here:\n${activeLink}\n\nReferral Code: ${referralCode}\n\nWarm regards,\n${portal.profile.fullName}\nEducation Consultant`;
  const emailShareHref = `mailto:?subject=${encodeURIComponent(emailShareSubject)}&body=${encodeURIComponent(emailShareBody)}`;

  async function handleCopyLink() {
    const ok = await copyText(activeLink);
    if (ok) {
      setCopiedTarget("link");
      portal.announce("Referral link copied to clipboard!");
      setTimeout(() => setCopiedTarget(null), 2500);
    } else {
      portal.announce("Failed to copy link. Please select and copy manually.");
    }
  }

  async function handleCopyCode() {
    const ok = await copyText(referralCode);
    if (ok) {
      setCopiedTarget("code");
      portal.announce(`Referral code ${referralCode} copied to clipboard!`);
      setTimeout(() => setCopiedTarget(null), 2500);
    } else {
      portal.announce("Failed to copy code. Please copy manually.");
    }
  }

  // Live metrics computed dynamically
  const metrics = useMemo(() => {
    const list = portal.referralLeads;
    const total = list.length;
    const newLeads = list.filter((l) => l.currentStatus === "New").length;
    const inProgress = list.filter((l) => l.currentStatus === "Contacted" || l.currentStatus === "In progress").length;
    const converted = list.filter((l) => l.currentStatus === "Converted").length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, newLeads, inProgress, converted, conversionRate };
  }, [portal.referralLeads]);

  // Filtered referral enquiries
  const filteredLeads = useMemo(() => {
    return portal.referralLeads.filter((lead) => {
      if (statusFilter !== "all" && lead.currentStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = lead.fullName.toLowerCase().includes(q);
        const courseMatch = lead.interestedCourse.toLowerCase().includes(q);
        return nameMatch || courseMatch;
      }
      return true;
    });
  }, [portal.referralLeads, statusFilter, searchQuery]);

  return (
    <div className={styles.pageStack}>
      <PageHeader
        eyebrow="LEAD GENERATION & ATTRIBUTION"
        title="My Referral Link"
        description="Share your personalized referral links across social platforms, WhatsApp, and email. When students submit enquiries, they are automatically linked to your consultant account."
      />

      {!portal.hydrated ? (
        <PortalCard title="Loading referral details">
          <p className={styles.tableMuted}>Opening your personal referral information…</p>
        </PortalCard>
      ) : (
        <>
          <section className={styles.referralHero}>
            <div className={styles.referralCard}>
              <div className={styles.referralHeaderRow}>
                <div className={styles.referralHeroIdentity}>
                  <PortalAvatar name={portal.profile.fullName} size="md" />
                  <div>
                    <strong>{portal.profile.fullName}</strong>
                    <small>Authorized Education Consultant</small>
                  </div>
                </div>

                <div className={styles.referralCodeWrap}>
                  <span className={styles.codeSnippet}>
                    <AdminIcon name="sparkle" size={13} />
                    {referralCode}
                  </span>
                  <button
                    type="button"
                    className={styles.copyCodeButton}
                    onClick={() => void handleCopyCode()}
                    title="Copy referral code"
                  >
                    {copiedTarget === "code" ? (
                      <span className={styles.copySuccessBadge}>
                        <AdminIcon name="check" size={12} />
                        Copied!
                      </span>
                    ) : (
                      <>
                        <AdminIcon name="copy" size={12} />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Destination selector */}
              <div className={styles.destinationSelector}>
                <span className={styles.destinationSelectorLabel}>Choose Landing Destination</span>
                <div className={styles.destinationTabs}>
                  <button
                    type="button"
                    className={`${styles.destinationTab} ${destination === "courses" ? styles.destinationTabActive : ""}`}
                    onClick={() => setDestination("courses")}
                  >
                    <AdminIcon name="content" size={14} />
                    Course Catalogue
                  </button>
                  <button
                    type="button"
                    className={`${styles.destinationTab} ${destination === "home" ? styles.destinationTabActive : ""}`}
                    onClick={() => setDestination("home")}
                  >
                    <AdminIcon name="globe" size={14} />
                    Home Page
                  </button>
                  <button
                    type="button"
                    className={`${styles.destinationTab} ${destination === "apply" ? styles.destinationTabActive : ""}`}
                    onClick={() => setDestination("apply")}
                  >
                    <AdminIcon name="file-text" size={14} />
                    Direct Application
                  </button>
                </div>
              </div>

              {/* Live URL box */}
              <div className={styles.referralLinkBox}>
                <code>{activeLink}</code>
                <div className={styles.referralLinkActions}>
                  <PortalButton
                    variant="primary"
                    icon={copiedTarget === "link" ? "check" : "copy"}
                    onClick={() => void handleCopyLink()}
                  >
                    {copiedTarget === "link" ? "Copied!" : "Copy Link"}
                  </PortalButton>
                  <a
                    className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                    href={activeLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <AdminIcon name="external" size={14} />
                    Open
                  </a>
                </div>
              </div>

              <p className={styles.referralExplainer}>{urls[destination].desc}.</p>

              {/* Quick 1-click share actions */}
              <div className={styles.shareActionsRow}>
                <a
                  className={styles.shareBtnWhatsapp}
                  href={waShareHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AdminIcon name="whatsapp" size={16} />
                  Share on WhatsApp
                </a>
                <a className={styles.shareBtnSecondary} href={emailShareHref}>
                  <AdminIcon name="mail" size={15} />
                  Share via Email
                </a>
              </div>
            </div>

            {/* Performance summary metrics */}
            <div className={styles.referralStatsGrid} aria-label="Referral performance summary">
              <div className={styles.referralStatCard}>
                <span>Total Referred Leads</span>
                <strong>{metrics.total}</strong>
                <small>Enquiries with your code</small>
              </div>
              <div className={styles.referralStatCard}>
                <span>New Enquiries</span>
                <strong>{metrics.newLeads}</strong>
                <small>Ready for initial outreach</small>
              </div>
              <div className={styles.referralStatCard}>
                <span>In Counseling</span>
                <strong>{metrics.inProgress}</strong>
                <small>Active student discussions</small>
              </div>
              <div className={styles.referralStatCard}>
                <span>Enrolled & Converted</span>
                <strong>{metrics.converted}</strong>
                <small>{metrics.conversionRate}% overall conversion rate</small>
              </div>
            </div>
          </section>

          {/* Referral lead records table */}
          <PortalCard
            title="Attributed Student Enquiries"
            subtitle={`${portal.referralLeads.length} student ${portal.referralLeads.length === 1 ? "enquiry" : "enquiries"} attributed to referral code ${referralCode}`}
          >
            <div className={styles.tableToolbar}>
              <div className={styles.filterGroup}>
                <label className={styles.searchField}>
                  <AdminIcon name="search" size={15} />
                  <input
                    type="search"
                    placeholder="Search by student or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </label>

                <label className={styles.filterControl}>
                  <AdminIcon name="filter" size={14} />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="In progress">In progress</option>
                    <option value="Converted">Converted</option>
                    <option value="Lost">Lost</option>
                  </select>
                </label>
              </div>

              {searchQuery || statusFilter !== "all" ? (
                <PortalButton
                  variant="quiet"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </PortalButton>
              ) : null}
            </div>

            {filteredLeads.length ? (
              <div className={styles.tableViewport}>
                <table className={styles.dataTable}>
                  <TableCaption>Student enquiries attributed to your referral code</TableCaption>
                  <thead>
                    <tr>
                      <th scope="col">Student Name</th>
                      <th scope="col">Date Captured</th>
                      <th scope="col">Interested Course</th>
                      <th scope="col">Current Status</th>
                      <th scope="col">Outcome</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className={styles.personCell}>
                            <PortalAvatar name={lead.fullName} size="sm" />
                            <span>
                              <strong>{lead.fullName}</strong>
                              <small>Referral lead</small>
                            </span>
                          </div>
                        </td>
                        <td>{formatDate(lead.capturedAt, { day: "numeric", month: "short", year: "numeric" })}</td>
                        <td>{lead.interestedCourse}</td>
                        <td>
                          <StatusBadge status={lead.currentStatus as ConsultantLeadStatus} />
                        </td>
                        <td>
                          <OutcomeBadge status={lead.currentStatus as ConsultantLeadStatus} />
                        </td>
                        <td>
                          {lead.authorizedLeadId ? (
                            <Link className={styles.tableLink} href={`/consultant/leads/${lead.authorizedLeadId}`}>
                              Open Lead <AdminIcon name="arrow-up-right" size={12} />
                            </Link>
                          ) : (
                            <span className={styles.tableMuted}>Assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyPanel
                title={searchQuery || statusFilter !== "all" ? "No matching enquiries found" : "No referral enquiries yet"}
                description={
                  searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Share your referral link on WhatsApp, LinkedIn, or student forums. Captured enquiries will appear here instantly."
                }
                icon="link"
                action={
                  searchQuery || statusFilter !== "all" ? (
                    <PortalButton
                      variant="secondary"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Reset filters
                    </PortalButton>
                  ) : (
                    <a
                      className={styles.shareBtnWhatsapp}
                      href={waShareHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <AdminIcon name="whatsapp" size={16} />
                      Share Referral on WhatsApp
                    </a>
                  )
                }
              />
            )}

            <div className={styles.attributionNotice}>
              <AdminIcon name="circle-info" size={15} />
              <span>
                <strong>How attribution works:</strong> Every enquiry submitted using your referral link or code is automatically registered to your consultant pipeline. You receive full attribution and instant access to counsel prospective students.
              </span>
            </div>
          </PortalCard>
        </>
      )}
    </div>
  );
}
