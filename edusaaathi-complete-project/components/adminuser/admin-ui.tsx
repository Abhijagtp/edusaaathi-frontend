"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import styles from "./admin.module.css";
import { AdminIcon, type AdminIconName } from "./admin-icon";

export function AdminButton({
  children, variant = "secondary", icon, className = "", ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; icon?: AdminIconName }) {
  return <button className={`${styles.button} ${styles[`button${variant[0].toUpperCase()}${variant.slice(1)}`]} ${className}`} {...props}>{icon ? <AdminIcon name={icon} size={16} /> : null}<span>{children}</span></button>;
}

export function IconButton({ label, icon, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: AdminIconName }) {
  return <button type="button" className={`${styles.iconButton} ${className}`} aria-label={label} title={label} {...props}><AdminIcon name={icon} size={17} /></button>;
}

export function PageHeading({
  eyebrow, title, description, actions, back,
}: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className={styles.pageHeading}>
      <div className={styles.pageHeadingMain}>
        {back ? <div className={styles.pageBack}>{back}</div> : null}
        <div>{eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}<h1>{title}</h1>{description ? <p className={styles.pageDescription}>{description}</p> : null}</div>
      </div>
      {actions ? <div className={styles.pageActions}>{actions}</div> : null}
    </div>
  );
}

export function Panel({ children, className = "", title, subtitle, action }: { children: ReactNode; className?: string; title?: string; subtitle?: string; action?: ReactNode }) {
  return (
    <section className={`${styles.panel} ${className}`}>
      {title || subtitle || action ? <div className={styles.panelHeader}><div>{title ? <h2>{title}</h2> : null}{subtitle ? <p>{subtitle}</p> : null}</div>{action ? <div className={styles.panelAction}>{action}</div> : null}</div> : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value, helper, change, icon, tone = "indigo" }: { label: string; value: string | number; helper?: string; change?: string; icon: AdminIconName; tone?: "indigo" | "green" | "amber" | "blue" | "rose" | "violet" }) {
  return (
    <article className={`${styles.statCard} ${styles[`stat${tone[0].toUpperCase()}${tone.slice(1)}`]}`}>
      <div className={styles.statTop}><span>{label}</span><span className={styles.statIcon}><AdminIcon name={icon} size={17} /></span></div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statBottom}>{change ? <span className={styles.statChange}><AdminIcon name="trend-up" size={13} />{change}</span> : null}<span>{helper}</span></div>
    </article>
  );
}

const statusClass: Record<string, string> = {
  New: "badgeNew", Contacted: "badgeContacted", "Follow-up": "badgeFollowup", Converted: "badgeConverted", Lost: "badgeLost",
  Active: "badgeActive", Inactive: "badgeInactive", Pending: "badgePending", Completed: "badgeCompleted", Overdue: "badgeOverdue", "Due today": "badgeDueToday", Website: "badgeSourceWebsite", "Consultant referral": "badgeSourceReferral", Published: "badgePublished", Draft: "badgeDraft",
};

export function Badge({ children, dot = false, className = "" }: { children: string; dot?: boolean; className?: string }) {
  const classToken = statusClass[children] || "badgeNeutral";
  return <span className={`${styles.badge} ${styles[classToken]} ${className}`}>{dot ? <i /> : null}{children}</span>;
}

export function Avatar({ name, size = "md", className = "" }: { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`${styles.avatar} ${styles[`avatar${size[0].toUpperCase()}${size.slice(1)}`]} ${className}`} aria-hidden="true">{initials || "?"}</span>;
}

export function Modal({ title, description, children, footer, onClose, size = "md" }: { title: string; description?: string; children: ReactNode; footer?: ReactNode; onClose: () => void; size?: "md" | "lg" }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") closeRef.current(); }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, []);
  function trapTab(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} onKeyDown={trapTab} className={`${styles.modal} ${styles[`modal${size[0].toUpperCase()}${size.slice(1)}`]}`} role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" aria-describedby={description ? "admin-modal-description" : undefined} tabIndex={-1}>
        <div className={styles.modalHeader}><div><h2 id="admin-modal-title">{title}</h2>{description ? <p id="admin-modal-description">{description}</p> : null}</div><IconButton label="Close dialog" icon="close" onClick={onClose} /></div>
        <div className={styles.modalBody}>{children}</div>
        {footer ? <div className={styles.modalFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function TextField({ label, hint, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = props.id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <label className={styles.field} htmlFor={id}><span>{label}{props.required ? <b> *</b> : null}</span><input {...props} id={id} aria-invalid={error ? true : props["aria-invalid"]} />{hint ? <small>{hint}</small> : null}{error ? <small className={styles.fieldError}>{error}</small> : null}</label>;
}

export function SelectField({ label, hint, options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; options: Array<{ value: string; label: string }> }) {
  const id = props.id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <label className={styles.field} htmlFor={id}><span>{label}{props.required ? <b> *</b> : null}</span><select {...props} id={id}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{hint ? <small>{hint}</small> : null}</label>;
}

export function TextAreaField({ label, hint, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = props.id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <label className={styles.field} htmlFor={id}><span>{label}{props.required ? <b> *</b> : null}</span><textarea {...props} id={id} />{hint ? <small>{hint}</small> : null}</label>;
}

export function Toggle({ label, description, checked, onChange, name }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; name?: string }) {
  return <label className={styles.toggleRow}><span><strong>{label}</strong>{description ? <small>{description}</small> : null}</span><input type="checkbox" name={name} checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

export function SearchField({ value, onChange, placeholder = "Search…", label = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string }) {
  return <label className={styles.searchField}><AdminIcon name="search" size={17} /><span className={styles.srOnly}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function EmptyState({ title, description, action, icon = "inbox" }: { title: string; description?: string; action?: ReactNode; icon?: AdminIconName }) {
  return <div className={styles.emptyState}><span><AdminIcon name={icon} size={23} /></span><h3>{title}</h3>{description ? <p>{description}</p> : null}{action ? <div>{action}</div> : null}</div>;
}

export function TablePagination({ page, pageCount, total, pageSize, onPageChange }: { page: number; pageCount: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className={styles.pagination}><span>Showing <strong>{start}–{end}</strong> of <strong>{total}</strong></span><div><IconButton label="Previous page" icon="chevron-left" disabled={page <= 1} onClick={() => onPageChange(page - 1)} /><span>{page} / {pageCount}</span><IconButton label="Next page" icon="chevron-right" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} /></div></div>
  );
}

export function FieldGrid({ children, columns = 2 }: { children: ReactNode; columns?: 1 | 2 }) {
  return <div className={`${styles.fieldGrid} ${columns === 1 ? styles.fieldGridOne : ""}`}>{children}</div>;
}
