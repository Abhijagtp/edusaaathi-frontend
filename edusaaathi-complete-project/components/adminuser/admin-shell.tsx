"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
    { label: "Follow-ups", href: "/adminuser/follow-ups", icon: "calendar" },
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
  consultants: "Consultants", referrals: "Referral Tracking", "follow-ups": "Follow-ups", analytics: "Analytics & Reports",
  courses: "Course Management", consultant: "Consultant Workspace", dashboard: "Dashboard", "website-content": "Website Content", settings: "Settings",
};

function isConsultantDashboardRoute(pathname: string): boolean {
  return pathname === "/adminuser/consultant" || pathname.startsWith("/adminuser/consultant/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { leads, consultants, followUps, hydrated, notice } = useAdminData();
  const { session, sessionHydrated, logout } = useAdminSession();
  const currentConsultant = session?.role === "consultant" ? consultants.find((item) => item.id === session.consultantId) : undefined;
  const displayName = currentConsultant?.name ?? ADMINISTRATOR_NAME;
  const displayRole = session?.role === "consultant" ? "Consultant demo" : "Administrator demo";
  const navGroups = session?.role === "consultant" ? consultantGroups : groups;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => {
    if (pathname === "/adminuser/login" || !sessionHydrated) return;
    if (!session) router.replace("/adminuser/login");
    else if (session.role === "consultant" && hydrated && !consultants.some((item) => item.id === session.consultantId)) {
      logout();
      router.replace("/adminuser/login");
    }
    else if (session.role === "consultant" && session.consultantId !== MOCK_CONSULTANT_ID) {
      logout();
      router.replace("/adminuser/login");
    }
    else if (session.role === "consultant") router.replace("/consultant");
    else if (session.role === "admin" && isConsultantDashboardRoute(pathname)) router.replace("/adminuser");
  }, [pathname, session, sessionHydrated, hydrated, consultants, logout, router]);
  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    function closeSearch(event: PointerEvent) {
      if (event.target instanceof Node && !searchWrapRef.current?.contains(event.target)) setSearchOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    document.addEventListener("pointerdown", closeSearch);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("pointerdown", closeSearch);
    };
  }, []);

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return leads.filter((lead) => `${lead.studentName} ${lead.phone} ${lead.email} ${lead.course}`.toLowerCase().includes(term)).slice(0, 5);
  }, [search, leads]);

  const dueItems = useMemo(() => followUps.filter((followUp) => followUp.status === "Pending" && followUp.date <= localDateString()).slice(0, 5), [followUps]);

  function isActive(href: string): boolean {
    if (href === "/adminuser") return pathname === href;
    if (href === "/adminuser/leads") return pathname === href || pathname.startsWith("/adminuser/leads/");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, index) => ({ label: crumbLabels[part] || (parts[index - 1] === "leads" ? "Lead details" : part), href: `/${parts.slice(0, index + 1).join("/")}` }));
  }, [pathname]);

  function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) router.push(`/adminuser/leads/${results[0].id}`);
    else if (search.trim()) router.push(`/adminuser/leads`);
    setSearchOpen(false);
  }

  if (pathname === "/adminuser/login") return <div className={styles.loginPageRoot}>{children}</div>;
  if (!sessionHydrated || !session) return <div className={styles.sessionLoading} role="status">Opening the local demo sign-in…</div>;
  if (session.role === "consultant" && !hydrated) return <div className={styles.sessionLoading} role="status">Loading consultant workspace…</div>;
  if (session.role === "consultant" && !currentConsultant) return <div className={styles.sessionLoading} role="status">Consultant demo account not found. Returning to demo sign-in…</div>;
  if (session.role === "consultant") return <div className={styles.sessionLoading} role="status">Opening your full consultant portal…</div>;
  if (session.role === "admin" && isConsultantDashboardRoute(pathname)) return <div className={styles.sessionLoading} role="status">Opening admin workspace…</div>;

  return (
    <div className={`${styles.adminRoot} ${collapsed ? styles.adminRootCollapsed : ""}`}>
      <a href="#main-content" className={styles.adminSkipLink}>Skip to main content</a>
      <div className={`${styles.sidebarScrim} ${mobileOpen ? styles.sidebarScrimVisible : ""}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      <aside id="admin-navigation" className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""} ${mobileOpen ? styles.sidebarMobileOpen : ""}`} aria-label="Admin navigation">
        <div className={styles.brandRow}>
          <Link href="/adminuser" className={styles.brand} aria-label="Edusaaathi admin workspace home"><span className={styles.brandMark}>E</span><span className={styles.brandCopy}><strong>Edusaaathi</strong><small>ADMIN WORKSPACE</small></span></Link>
          <button className={styles.sidebarClose} type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><AdminIcon name="close" /></button>
        </div>
        <div className={styles.workspaceSwitcher}><span className={styles.workspaceAvatar}>ES</span><span><strong>Education team</strong><small>Admin workspace</small></span><AdminIcon name="chevron-down" size={15} /></div>
        <nav className={styles.sideNav} aria-label="Admin sections">
          {navGroups.map((group) => <div className={styles.navGroup} key={group.label}>
            <p className={styles.navGroupLabel}>{group.label}</p>
            {group.items.map((item) => <Link className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ""}`} key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} title={collapsed ? item.label : undefined}>
              <AdminIcon name={item.icon} size={18} /><span>{item.label}</span>{item.href === "/adminuser/follow-ups" && dueItems.length > 0 ? <b className={styles.navCount}>{dueItems.length}</b> : null}
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
            {session.role === "admin" ? (
              <div className={styles.globalSearchWrap} ref={searchWrapRef}>
                <form className={styles.globalSearch} role="search" onSubmit={runSearch}>
                  <AdminIcon name="search" size={16} />
                  <input ref={searchInputRef} aria-label="Search leads" aria-expanded={searchOpen && Boolean(search.trim())} aria-controls="admin-lead-search-results" value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }} placeholder="Search anything…" />
                  <kbd>⌘/Ctrl K</kbd>
                </form>
                {searchOpen && search.trim() ? (
                  <div className={styles.searchDropdown} id="admin-lead-search-results" role="region" aria-label="Lead search results">
                    {results.length ? results.map((lead) => (
                      <Link href={`/adminuser/leads/${lead.id}`} key={lead.id} onClick={() => setSearchOpen(false)}>
                        <span className={styles.searchResultAvatar}>{lead.studentName.slice(0, 1)}</span>
                        <span><strong>{lead.studentName}</strong><small>{lead.course} · {lead.phone}</small></span>
                        <AdminIcon name="arrow-up-right" size={15} />
                      </Link>
                    )) : <p role="status">No matching leads.</p>}
                    <button type="button" onClick={() => { router.push("/adminuser/leads"); setSearchOpen(false); }}>View all leads <AdminIcon name="arrow-right" size={14} /></button>
                  </div>
                ) : null}
              </div>
            ) : <span className={styles.topbarMode}>Consultant demo</span>}

            {session.role === "admin" ? (
              <div className={styles.headerPopoverWrap}>
                <button type="button" className={`${styles.headerIconButton} ${notificationsOpen ? styles.headerIconButtonActive : ""}`} aria-label={`Notifications${dueItems.length ? `, ${dueItems.length} due` : ""}`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false); }}>
                  <AdminIcon name="bell" size={18} />{dueItems.length ? <i /> : null}
                </button>
                {notificationsOpen ? (
                  <div className={`${styles.popover} ${styles.notificationPopover}`}>
                    <div className={styles.popoverHeader}><div><strong>Follow-up reminders</strong><small>{dueItems.length} overdue or due today</small></div><Link href="/adminuser/follow-ups" onClick={() => setNotificationsOpen(false)}>View all</Link></div>
                    {dueItems.length ? dueItems.map((item) => {
                      const lead = leads.find((entry) => entry.id === item.leadId);
                      return (
                        <Link href={`/adminuser/leads/${item.leadId}`} className={styles.notificationItem} key={item.id} onClick={() => setNotificationsOpen(false)}>
                          <span className={styles.notificationDot} />
                          <span><strong>{lead?.studentName || "Lead"}</strong><small>{item.date === localDateString() ? "Due today" : "Overdue"} · {item.time} · {getConsultantName(consultants, item.consultantId)}</small></span>
                        </Link>
                      );
                    }) : <div className={styles.popoverEmpty}>You’re all caught up.</div>}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className={styles.headerPopoverWrap}>
              <button type="button" className={styles.profileButton} aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false); }}>
                <span className={styles.profileAvatar}>{displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
                <span className={styles.profileText}><strong>{displayName}</strong><small>{displayRole}</small></span>
                <AdminIcon name="chevron-down" size={15} />
              </button>
              {profileOpen ? (
                <div className={`${styles.popover} ${styles.profilePopover}`}>
                  <div className={styles.profilePopoverTop}><span className={styles.profileAvatar}>{displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{displayName}</strong><small>{displayRole} · not authenticated</small></span></div>
                  <button type="button" onClick={() => setProfileMessage("This is a visual demo session only. The Django backend must enforce production authentication and permissions.")}>About demo access</button>
                  <button type="button" onClick={() => { logout(); router.push("/adminuser/login"); }}>Switch demo role</button>
                  <button type="button" onClick={() => { logout(); router.push("/adminuser/login"); }}>Sign out of demo</button>
                  {profileMessage ? <p role="status">{profileMessage}</p> : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className={styles.contentArea} id="main-content">
          <div className={styles.demoBanner}><AdminIcon name="circle-info" size={16} /><span><strong>Frontend demo mode</strong> · Website courses are read from the existing catalog; edits here stay in this browser and are not published. This demo sign-in is not authentication—Django must enforce permissions in production.</span></div>
          {notice ? <div className={styles.toast} role="status"><AdminIcon name="check-circle" size={17} />{notice}</div> : null}
          {!hydrated ? <div className={styles.loadingLine} role="status">Loading admin demo data…</div> : null}
          {children}
          <footer className={styles.adminFooter}><span>Edusaaathi · Frontend prototype</span><span>Browser-local demo · No course publishing or backend writes</span></footer>
        </main>
      </div>
    </div>
  );
}
