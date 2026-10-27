import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function ArrowRightIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M4.75 12h14.5M13 5.75 19.25 12 13 18.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function ArrowUpRightIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M7 17 17 7M7.75 7H17v9.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function CheckIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="m5 12.5 4.3 4.2L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function CloseIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

export function MenuIcon({ open, ...props }: IconProps & { open?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>{open ? <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : <path d="M4.5 8h15M4.5 16h15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}</svg>;
}

export function WhatsAppIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M20 11.65a8.08 8.08 0 0 1-11.95 7.08L4 20l1.32-3.85A8.1 8.1 0 1 1 20 11.65Z" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8.25c.22-.4.41-.42.63-.42h.34c.12 0 .3.03.4.3l.55 1.3c.07.17.07.3-.04.46l-.43.55c-.13.15-.18.28-.05.49.37.65.91 1.2 1.56 1.56.22.12.34.08.5-.05l.55-.44c.16-.12.3-.13.46-.06l1.3.55c.25.1.29.28.29.4v.34c0 .22-.02.42-.42.64-.4.22-.93.34-1.65.12-.72-.23-1.5-.64-2.36-1.5-.85-.85-1.28-1.64-1.5-2.36-.22-.72-.1-1.25.12-1.65Z" fill="currentColor"/></svg>;
}

export function CompassIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.5"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><circle cx="12" cy="12" r=".8" fill="currentColor"/></svg>;
}

export function SparkIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M12 2.75 14.08 9.9l7.17 2.1-7.17 2.08L12 21.25 9.92 14.08 2.75 12l7.17-2.1L12 2.75Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m19 2 .55 1.85L21.4 4.4l-1.85.55L19 6.8l-.55-1.85L16.6 4.4l1.85-.55L19 2Z" fill="currentColor"/></svg>;
}

export function BookIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><path d="M4.25 5.75A2.5 2.5 0 0 1 6.75 3.5H20v16H6.75a2.5 2.5 0 0 0-2.5 2.5v-16.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M4.25 18a2.5 2.5 0 0 1 2.5-2.5H20M8 7.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}

export function RouteIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}><circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
