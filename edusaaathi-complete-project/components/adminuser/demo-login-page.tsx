"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MOCK_CONSULTANT_ID } from "@/lib/consultant/mock-service";
import { useAdminData } from "./admin-data-provider";
import { useAdminSession } from "./admin-session-provider";
import { AdminButton } from "./admin-ui";
import { AdminIcon } from "./admin-icon";
import styles from "./admin.module.css";

type Role = "admin" | "consultant";

export function DemoLoginPage() {
  const router = useRouter();
  const { consultants, hydrated } = useAdminData();
  const { session, sessionHydrated, loginAsAdmin, loginAsConsultant, logout } = useAdminSession();
  const [role, setRole] = useState<Role>("admin");
  const consultant = consultants.find((item) => item.id === MOCK_CONSULTANT_ID);

  useEffect(() => {
    if (!sessionHydrated || !session) return;
    if (session.role === "consultant") {
      if (session.consultantId === MOCK_CONSULTANT_ID) router.replace("/consultant");
      else logout();
      return;
    }
    router.replace("/adminuser");
  }, [session, sessionHydrated, router, logout]);

  function enterDemo() {
    if (role === "admin") {
      loginAsAdmin();
      router.replace("/adminuser");
      return;
    }
    if (!hydrated || !consultant || consultant.status !== "Active") return;
    loginAsConsultant(MOCK_CONSULTANT_ID);
    router.replace("/consultant");
  }

  return <main className={styles.demoLoginShell}>
    <div className={styles.demoLoginBackdrop} aria-hidden="true"><span /><i /><b /></div>
    <div className={styles.demoLoginTop}><Link href="/" className={styles.demoLoginBrand}><span>E</span>Edusaaathi</Link><Link href="/admin/login" className={styles.productionLoginLink}>Production admin sign-in <AdminIcon name="arrow-up-right" size={14} /></Link></div>
    <section className={styles.demoLoginCard} aria-labelledby="demo-login-title">
      <div className={styles.demoLoginBrandMark}>E</div>
      <span className={styles.demoOnlyTag}><AdminIcon name="circle-info" size={14} />DEMO ONLY</span>
      <p className={styles.eyebrow}>EDUSAAATHI WORKSPACE</p>
      <h1 id="demo-login-title">Choose a demo<br /><em>workspace.</em></h1>
      <p className={styles.demoLoginDescription}>This simulated sign-in only switches the frontend view. It does not verify credentials or secure any data.</p>
      <div className={styles.loginTabs} role="tablist" aria-label="Choose demo role">
        <button type="button" role="tab" aria-selected={role === "admin"} className={role === "admin" ? styles.loginTabActive : ""} onClick={() => setRole("admin")}><AdminIcon name="settings" size={15} />Admin</button>
        <button type="button" role="tab" aria-selected={role === "consultant"} className={role === "consultant" ? styles.loginTabActive : ""} onClick={() => setRole("consultant")}><AdminIcon name="users-round" size={15} />Consultant</button>
      </div>
      {role === "admin" ? <div className={styles.demoLoginRoleCard}><span className={styles.demoLoginRoleIcon}><AdminIcon name="building" size={18} /></span><div><strong>Administrator demo</strong><small>Lead management, course catalog, consultants, reports and settings.</small></div></div> : <div className={styles.demoLoginConsultant}>
        <div className={styles.demoLoginRoleCard}><span className={styles.demoLoginRoleIcon}><AdminIcon name="users-round" size={18} /></span><div><strong>{consultant?.name ?? "Rahul Mehta"}</strong><small>Full consultant workspace · leads, follow-ups, referrals, performance and profile.</small></div></div>
        {!hydrated ? <p className={styles.helperInfo}><AdminIcon name="circle-info" size={14} />Loading the consultant demo account…</p> : !consultant || consultant.status !== "Active" ? <p className={styles.formError}>The Rahul Mehta consultant demo account is unavailable. Sign in as admin to review consultant status.</p> : <p className={styles.helperInfo}><AdminIcon name="circle-info" size={14} />You’ll open the full consultant portal directly after this demo sign-in.</p>}
      </div>}
      <AdminButton variant="primary" className={styles.demoLoginButton} icon="arrow-right" disabled={role === "consultant" && (!hydrated || !consultant || consultant.status !== "Active")} onClick={enterDemo}>{role === "admin" ? "Enter admin demo" : "Enter consultant portal"}</AdminButton>
      <div className={styles.demoLoginSecurity}><AdminIcon name="lock" size={15} /><span>No password is requested. Do not use real or sensitive data in this demo.</span></div>
      <p className={styles.demoLoginFooter}>Keep using the existing <Link href="/admin/login">secure admin sign-in</Link> for the current production-auth flow.</p>
    </section>
    <footer className={styles.demoLoginPageFooter}><span>Edusaaathi Admin · Browser-local prototype</span><span>Demo sign-in is not authentication</span></footer>
  </main>;
}
