"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { localDateString, getConsultantName } from "@/lib/adminuser/mock-data";
import { ADMINISTRATOR_NAME } from "@/lib/adminuser/mock-data";
import { MOCK_CONSULTANT_ID } from "@/lib/consultant/mock-service";
import { useAdminData } from "./admin-data-provider";
import { useAdminSession } from "./admin-session-provider";
import { AdminIcon, type AdminIconName } from "./admin-icon";
import styles from "./admin.module.css";

const groups: Array<{ label: string; items: Array<{ label: string; href: string; icon: AdminIconName }> }> = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/adminuser", icon: "dashboard" }] },
  { label: "Lead Management", items: [
    { label: "All Leads", href: "/adminuser/leads", icon: "users" },
    { label: "Website Enquiries", href: "/adminuser/website-enquiries", icon: "inbox" },
    { label: "Referral Leads", href: "/adminuser/referral-leads", icon: "referral" },
  ] },
  { label: "Team", items: [
    { label: "Consultants", href: "/adminuser/consultants", icon: "users-round" },
    { label: "Referral Tracking", href: "/adminuser/referrals", icon: "link" },
  ] },
  { label: "Insights", items: [{ label: "Analytics & Reports", href: "/adminuser/analytics", icon: "analytics" }] },
  { label: "Configuration", items: [
    { label: "Course Management", href: "/adminuser/courses", icon: "file-text" },
    { label: "Website Content", href: "/adminuser/website-content", icon: "content" },
    { label: "Settings", href: "/adminuser/settings", icon: "settings" },
  ] },
];

const consultantGroups: typeof groups = [
  { label: "Consultant Workspace", items: [{ label: "My Dashboard", href: "/adminuser/consultant/dashboard", icon: "dashboard" }] },
];

const crumbLabels: Record<string, string> = {
  adminuser: "Dashboard", leads: "All Leads", "website-enquiries": "Website Enquiries", "referral-leads": "Referral Leads",
  consultants: "Consultants", referrals: "Referral Tracking", analytics: "Analytics & Reports",
  courses: "Course Management", consultant: "Consultant Workspace", dashboard: "Dashboard", "website-content": "Website Content", settings: "Settings",
};

function isConsultantDashboardRoute(pathname: string): boolean {
  return pathname === "/adminuser/consultant" || pathname.startsWith("/adminuser/consultant/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { leads, consultants, hydrated, notice } = useAdminData();
  const { session, sessionHydrated, logout } = useAdminSession();
  const currentConsultant = session?.role === "consultant" ? consultants.find((item) => item.id === session.consultantId) : undefined;
  const displayName = session?.name || currentConsultant?.name || ADMINISTRATOR_NAME;
  const displayRole = session?.role === "consultant" ? "Consultant" : "Administrator";
  const navGroups = session?.role === "consultant" ? consultantGroups : groups;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!sessionHydrated) return;
    if (!session) router.replace("/admin/login");
    else if (session.role === "consultant") router.replace("/consultant");
    else if (session.role === "admin" && isConsultantDashboardRoute(pathname)) router.replace("/adminuser");
  }, [pathname, session, sessionHydrated, router]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const newLeads = useMemo(() => leads.filter((lead) => lead.status === "New"), [leads]);

  function isActive(href: string): boolean {
    if (href === "/adminuser") return pathname === href;
    if (href === "/adminuser/leads") return pathname === href || pathname.startsWith("/adminuser/leads/");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => ({ label: crumbLabels[part] || (parts[index - 1] === "leads" ? "Lead details" : part), href: `/${parts.slice(0, index + 1).join("/")}` }));
  }, [pathname]);


  if (!sessionHydrated || !session) return <div className={styles.sessionLoading} role="status">Verifying workspace session…</div>;
  if (session.role === "consultant") return <div className={styles.sessionLoading} role="status">Opening your full consultant portal…</div>;
  if (session.role === "admin" && isConsultantDashboardRoute(pathname)) return <div className={styles.sessionLoading} role="status">Opening admin workspace…</div>;

  return (
    <div className={`${styles.adminRoot} ${collapsed ? styles.adminRootCollapsed : ""}`}>
      <a href="#main-content" className={styles.adminSkipLink}>Skip to main content</a>
      <div className={`${styles.sidebarScrim} ${mobileOpen ? styles.sidebarScrimVisible : ""}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <aside id="admin-navigation" className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`} aria-label="Admin navigation">
        <div className={styles.brandRow}>
          <Link href="/adminuser" className={styles.brand} aria-label="Edusaaathi admin workspace home">
            <span className={styles.brandMark} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "3px" }}>
              <Image src="/logo.png" alt="Edusaaathi" width={30} height={30} style={{ objectFit: "contain" }} priority />
            </span>
            <span className={styles.brandCopy}><strong>Edusaaathi</strong><small>ADMIN WORKSPACE</small></span>
          </Link>
          <button className={styles.sidebarClose} type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><AdminIcon name="close" /></button>
        </div>
        <nav className={styles.sideNav} aria-label="Admin sections">
          {navGroups.map((group) => <div className={styles.navGroup} key={group.label}>
            <p className={styles.navGroupLabel}>{group.label}</p>
            {group.items.map((item) => <Link className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`} key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} title={collapsed ? item.label : undefined}>
              <AdminIcon name={item.icon} size={18} /><span>{item.label}</span>{item.href === "/adminuser/leads" && newLeads.length > 0 ? <b className={styles.navCount}>{newLeads.length}</b> : null}
            </Link>)}
          </div>)}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.helpCard}><span className={styles.helpIcon}><AdminIcon name="circle-info" size={17} /></span><div><strong>Need a hand?</strong><small>Workspace guide</small></div><AdminIcon name="arrow-up-right" size={14} /></div>
          <button type="button" className={styles.sidebarCollapse} onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><AdminIcon name={collapsed ? "chevron-right" : "chevron-left"} size={17} /><span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span></button>
        </div>
      </aside>

      <div className={styles.mainRegion}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}><button type="button" className={styles.mobileMenu} aria-label="Open admin navigation" aria-expanded={mobileOpen} aria-controls="admin-navigation" onClick={() => setMobileOpen(true)}><AdminIcon name="menu" /></button><nav className={styles.breadcrumbs} aria-label="Breadcrumb">{crumbs.map((crumb, index) => <span key={crumb.href}>{index > 0 ? <AdminIcon name="chevron-right" size={13} /> : null}{index === crumbs.length - 1 ? <strong>{crumb.label}</strong> : <Link href={crumb.href}>{crumb.label}</Link>}</span>)}</nav></div>
          <div className={styles.topbarActions}>
            <div className={styles.headerPopoverWrap}>
              <button type="button" className={styles.profileButton} aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}>
                <span className={styles.profileAvatar}>{displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
                <span className={styles.profileText}><strong>{displayName}</strong><small>{displayRole}</small></span>
                <AdminIcon name="chevron-down" size={15} />
              </button>
              {profileOpen ? (
                <div className={`${styles.popover} ${styles.profilePopover}`}>
                  <div className={styles.profilePopoverTop}><span className={styles.profileAvatar}>{displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{displayName}</strong><small>{displayRole} · Live API Active</small></span></div>
                  <button type="button" onClick={() => setProfileMessage("Authenticated via Django JWT. Changes to courses, leads, and consultants sync with the backend.")}>API Status</button>
                  <button type="button" onClick={async () => {
                    await fetch("/api/admin/logout", { method: "POST" });
                    logout();
                    router.push("/admin/login");
                  }}>Sign out</button>
                  {profileMessage ? <p role="status">{profileMessage}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className={styles.contentArea} id="main-content">
          {notice ? <div className={styles.toast} role="status"><AdminIcon name="check-circle" size={17} />{notice}</div> : null}
          {!hydrated ? <div className={styles.loadingLine} role="status">Loading admin workspace data…</div> : null}
          {children}
          <footer className={styles.adminFooter}><span>Edusaaathi Admin Workspace</span><span>Connected to Django REST Framework &amp; Neon PostgreSQL</span></footer>
        </main>
      </div>
    </div>
  );
}
