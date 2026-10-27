"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "@/components/adminuser/admin-icon";
import { useConsultantPortal } from "./consultant-provider";
import styles from "./consultant.module.css";

type NavItem = { label: string; href: string; icon: AdminIconName };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/consultant", icon: "dashboard" }] },
  { label: "Student Management", items: [
    { label: "My Leads", href: "/consultant/leads", icon: "users" },
    { label: "Follow-ups", href: "/consultant/follow-ups", icon: "calendar" },
  ] },
  { label: "Lead Generation", items: [{ label: "My Referral Link", href: "/consultant/referrals", icon: "link" }] },
  { label: "Insights", items: [{ label: "My Performance", href: "/consultant/performance", icon: "chart" }] },
  { label: "Account", items: [{ label: "My Profile", href: "/consultant/profile", icon: "user" }] },
];

const routeTitles: Record<string, string> = {
  consultant: "Dashboard",
  leads: "My Leads",
  "follow-ups": "Follow-ups",
  referrals: "My Referral Link",
  performance: "My Performance",
  profile: "My Profile",
};

export function ConsultantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, hydrated, notice } = useConsultantPortal();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const pathParts = pathname.split("/").filter(Boolean);
  const currentTitle = pathParts[1] === "leads" && pathParts.length > 2 ? "Lead details" : routeTitles[pathParts[1] ?? "consultant"] ?? "Lead details";
  const initials = profile.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CM";

  useEffect(() => { setMobileOpen(false); setProfileOpen(false); }, [pathname]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
      }
    }
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !profileWrapRef.current?.contains(event.target)) setProfileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  function isActive(href: string): boolean {
    if (href === "/consultant") return pathname === href;
    if (href === "/consultant/leads") return pathname === href || pathname.startsWith("/consultant/leads/");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className={`${styles.portalRoot} ${collapsed ? styles.portalRootCollapsed : ""}`}>
      <a href="#consultant-main" className={styles.skipLink}>Skip to main content</a>
      <button type="button" className={`${styles.mobileScrim} ${mobileOpen ? styles.mobileScrimVisible : ""}`} onClick={() => setMobileOpen(false)} aria-label="Close navigation" tabIndex={mobileOpen ? 0 : -1} />
      <aside id="consultant-navigation" className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`} aria-label="Consultant navigation">
        <div className={styles.brandRow}>
          <Link href="/consultant" className={styles.brand} aria-label="Edusaaathi consultant dashboard">
            <span className={styles.brandMark}>E</span>
            <span className={styles.brandCopy}><strong>Edusaaathi</strong><small>CONSULTANT PORTAL</small></span>
          </Link>
          <button type="button" className={styles.mobileClose} onClick={() => setMobileOpen(false)} aria-label="Close navigation"><AdminIcon name="close" /></button>
        </div>
        <div className={styles.workspaceCard}>
          <span className={styles.avatarSmall}>{initials}</span>
          <span className={styles.workspaceCopy}><strong>{hydrated ? profile.fullName : "Consultant"}</strong><small>Consultant workspace</small></span>
          <span className={styles.workspaceChevron}><AdminIcon name="chevron-down" size={15} /></span>
        </div>
        <nav className={styles.sideNav} aria-label="Consultant sections">
          {navGroups.map((group) => (
            <div className={styles.navGroup} key={group.label}>
              <p className={styles.navGroupLabel}>{group.label}</p>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} aria-current={isActive(item.href) ? "page" : undefined} className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`}>
                  <AdminIcon name={item.icon} size={18} /><span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.sideTip}><span><AdminIcon name="circle-info" size={16} /></span><div><strong>Keep the next step clear</strong><small>A timely follow-up helps every enquiry move forward.</small></div></div>
          <button type="button" className={styles.collapseButton} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}><AdminIcon name={collapsed ? "chevron-right" : "chevron-left"} size={16} /><span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span></button>
        </div>
      </aside>

      <div className={styles.mainRegion}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button type="button" className={styles.menuButton} aria-label="Open consultant navigation" aria-expanded={mobileOpen} aria-controls="consultant-navigation" onClick={() => setMobileOpen(true)}><AdminIcon name="menu" /></button>
            <div className={styles.breadcrumb}><span>Consultant workspace</span><AdminIcon name="chevron-right" size={14} /><strong>{currentTitle}</strong></div>
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.demoChip}><i />Mock account · not authenticated</span>
            <div className={styles.profileWrap} ref={profileWrapRef}>
              <button type="button" className={styles.profileButton} aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}>
                <span className={styles.profileAvatar}>{initials}</span>
                <span className={styles.profileButtonCopy}><strong>{profile.fullName}</strong><small>Consultant</small></span>
                <AdminIcon name="chevron-down" size={14} />
              </button>
              {profileOpen ? (
                <div className={styles.profileMenu}>
                  <div className={styles.profileMenuHead}><span className={styles.profileAvatar}>{initials}</span><span><strong>{profile.fullName}</strong><small>{profile.email}</small></span></div>
                  <Link href="/consultant/profile" onClick={() => setProfileOpen(false)}><AdminIcon name="user" size={15} />My profile</Link>
                  <p>This is a frontend-only prototype. Production sign-in and record permissions must be enforced by Django REST Framework.</p>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className={styles.mainContent} id="consultant-main">
          <div className={styles.demoNotice}><AdminIcon name="circle-info" size={16} /><span><strong>Demo data</strong> · Changes are saved in this browser only. WhatsApp opens your own account and does not confirm a message was sent.</span></div>
          {notice ? <div className={styles.toast} role="status" aria-live="polite"><AdminIcon name="check-circle" size={17} />{notice}</div> : null}
          {children}
          <footer className={styles.portalFooter}><span>Edusaaathi consultant workspace</span><span>Personal mock data · No backend connection</span></footer>
        </main>
      </div>
    </div>
  );
}
