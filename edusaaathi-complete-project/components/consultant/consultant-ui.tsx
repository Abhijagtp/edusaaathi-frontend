import { useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Link from "next/link";
import { AdminIcon, type AdminIconName } from "@/components/adminuser/admin-icon";
import type { ConsultantLeadStatus } from "@/lib/consultant/types";
import styles from "./consultant.module.css";

export function PageHeader({ eyebrow, title, description, actions, back }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; back?: ReactNode }) {
  return <div className={styles.pageHeader}><div className={styles.pageHeaderText}>{back ? <div className={styles.pageBack}>{back}</div> : null}{eyebrow ? <p className={styles.pageEyebrow}>{eyebrow}</p> : null}<h1>{title}</h1>{description ? <p className={styles.pageDescription}>{description}</p> : null}</div>{actions ? <div className={styles.pageHeaderActions}>{actions}</div> : null}</div>;
}

export function PortalCard({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className}`}><div className={styles.cardHeader}><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{action ? <div className={styles.cardHeaderAction}>{action}</div> : null}</div>{children}</section>;
}

export function MetricCard({ label, value, note, icon, tone = "indigo" }: { label: string; value: string | number; note: string; icon: AdminIconName; tone?: "indigo" | "green" | "amber" | "blue" | "purple" | "rose" }) {
  return <article className={`${styles.metricCard} ${styles[`metric${tone[0].toUpperCase()}${tone.slice(1)}`]}`}><div className={styles.metricTop}><span>{label}</span><i><AdminIcon name={icon} size={17} /></i></div><strong>{value}</strong><small>{note}</small></article>;
}

const statusClasses: Record<ConsultantLeadStatus, string> = {
  New: "statusNew",
  Contacted: "statusContacted",
  "Follow-up": "statusFollowUp",
  Converted: "statusConverted",
  Lost: "statusLost",
};

export function StatusBadge({ status, dot = true }: { status: ConsultantLeadStatus; dot?: boolean }) {
  return <span className={`${styles.statusBadge} ${styles[statusClasses[status]]}`}>{dot ? <i /> : null}{status}</span>;
}

export function FollowUpBadge({ completed }: { completed: boolean }) {
  return <span className={`${styles.followupStatusBadge} ${completed ? styles.followupStatusComplete : styles.followupStatusPending}`}>{completed ? "Completed" : "Pending"}</span>;
}

export function OutcomeBadge({ status }: { status: ConsultantLeadStatus }) {
  const label = status === "Converted" ? "Converted" : status === "Lost" ? "Not converted" : "In progress";
  const tone = status === "Converted" ? styles.outcomeSuccess : status === "Lost" ? styles.outcomeMuted : styles.outcomeProgress;
  return <span className={`${styles.outcomeBadge} ${tone}`}>{label}</span>;
}

export function PortalAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={`${styles.portalAvatar} ${styles[`portalAvatar${size[0].toUpperCase()}${size.slice(1)}`]}`} aria-hidden="true">{initials || "?"}</span>;
}

export function IconAction({ label, icon, href, onClick, target, disabled, tone = "default" }: { label: string; icon: AdminIconName; href?: string; onClick?: () => void; target?: string; disabled?: boolean; tone?: "default" | "whatsapp" | "danger" }) {
  const className = `${styles.iconAction} ${tone === "whatsapp" ? styles.iconActionWhatsapp : ""} ${tone === "danger" ? styles.iconActionDanger : ""}`;
  if (href?.startsWith("/") && !target) return <Link className={className} href={href} aria-label={label} title={label}><AdminIcon name={icon} size={15} /></Link>;
  if (href) return <a className={className} href={href} target={target} rel={target === "_blank" ? "noreferrer" : undefined} aria-label={label} title={label}><AdminIcon name={icon} size={15} /></a>;
  return <button className={className} type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}><AdminIcon name={icon} size={15} /></button>;
}

export function EmptyPanel({ title, description, icon = "inbox", action }: { title: string; description: string; icon?: AdminIconName; action?: ReactNode }) {
  return <div className={styles.emptyPanel}><span><AdminIcon name={icon} size={22} /></span><strong>{title}</strong><p>{description}</p>{action ? <div>{action}</div> : null}</div>;
}

export function TableCaption({ children }: { children: ReactNode }) {
  return <caption className={styles.srOnly}>{children}</caption>;
}

export function PortalButton({ children, icon, variant = "secondary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon?: AdminIconName; variant?: "primary" | "secondary" | "quiet" | "danger" }) {
  return <button className={`${styles.actionButton} ${styles[`actionButton${variant[0].toUpperCase()}${variant.slice(1)}`]} ${className}`} {...props}>{icon ? <AdminIcon name={icon} size={16} /> : null}<span>{children}</span></button>;
}

export function PortalDialog({ title, description, onClose, children, footer }: { title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
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
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])');
    if (!nodes?.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <div className={styles.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="consultant-dialog-title" aria-describedby={description ? "consultant-dialog-description" : undefined} tabIndex={-1} onKeyDown={trapTab}><div className={styles.dialogHeader}><div><h2 id="consultant-dialog-title">{title}</h2>{description ? <p id="consultant-dialog-description">{description}</p> : null}</div><button type="button" className={styles.iconAction} onClick={onClose} aria-label="Close dialog"><AdminIcon name="close" size={17} /></button></div><div className={styles.dialogBody}>{children}</div>{footer ? <div className={styles.dialogFooter}>{footer}</div> : null}</div></div>;
}

export function FormInput({ label, hint, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const id = props.id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <label className={styles.formField} htmlFor={id}><span>{label}{props.required ? <b> *</b> : null}</span><input {...props} id={id} aria-invalid={error ? true : props["aria-invalid"]} />{hint ? <small>{hint}</small> : null}{error ? <small className={styles.fieldError}>{error}</small> : null}</label>;
}

export function FormSelect({ label, options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Array<{ value: string; label: string }> }) {
  const id = props.id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <label className={styles.formField} htmlFor={id}><span>{label}{props.required ? <b> *</b> : null}</span><select {...props} id={id}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export function FormTextarea({ label, hint, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const id = props.id || props.name || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <label className={styles.formField} htmlFor={id}><span>{label}{props.required ? <b> *</b> : null}</span><textarea {...props} id={id} />{hint ? <small>{hint}</small> : null}</label>;
}
