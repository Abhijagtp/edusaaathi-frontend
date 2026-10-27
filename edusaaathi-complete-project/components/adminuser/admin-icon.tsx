import type { ReactNode, SVGProps } from "react";

export type AdminIconName =
  | "dashboard" | "users" | "inbox" | "referral" | "calendar" | "analytics" | "content" | "settings"
  | "search" | "bell" | "menu" | "close" | "chevron-down" | "chevron-up" | "chevron-left" | "chevron-right"
  | "arrow-right" | "arrow-up-right" | "plus" | "filter" | "download" | "edit" | "whatsapp" | "phone"
  | "mail" | "clock" | "check" | "check-circle" | "more" | "copy" | "external" | "sparkle" | "user"
  | "building" | "globe" | "eye" | "link" | "trash" | "refresh" | "note" | "send" | "users-round" | "chart"
  | "calendar-days" | "file-text" | "save" | "sliders" | "logout" | "trend-up" | "target" | "circle-info" | "lock";

type Props = SVGProps<SVGSVGElement> & { name: AdminIconName; size?: number };

const paths: Record<AdminIconName, ReactNode> = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.4"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.4"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.4"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.4"/></>,
  users: <><path d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 18.3V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M17 11a3.5 3.5 0 0 0 0-6.8M21 20v-1.7a3.3 3.3 0 0 0-2.5-3.2"/></>,
  inbox: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 13h4.5l1.8 2h4.4l1.8-2H21"/></>,
  referral: <><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="m9.2 9.2 5.6 5.6M14.8 8.2 18 5m-3 0h3v3M6 16l-3 3m0-3v3h3"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  analytics: <><path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/><path d="M2.5 20.5h19"/></>,
  content: <><path d="M4 5h16M4 10h9M4 15h16M4 20h9"/><circle cx="17" cy="10" r="2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3.7a1.8 1.8 0 0 1 0-3.6h.2a1.7 1.7 0 0 0 1.2-2.9L5 5.5A1.8 1.8 0 0 1 7.5 3l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.2a1.8 1.8 0 0 1 3.6 0v.2A1.7 1.7 0 0 0 17 3.1l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.8 1.8 0 0 1 0 3.6h-.2a1.7 1.7 0 0 0-1.3 2.9Z" transform="translate(1.1 1.1) scale(.91)"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  "chevron-down": <path d="m6 9 6 6 6-6"/>,
  "chevron-up": <path d="m6 15 6-6 6 6"/>,
  "chevron-left": <path d="m15 18-6-6 6-6"/>,
  "chevron-right": <path d="m9 18 6-6-6-6"/>,
  "arrow-right": <><path d="M4 12h15M13 6l6 6-6 6"/></>,
  "arrow-up-right": <><path d="M7 17 17 7M8 7h9v9"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  filter: <><path d="M4 5h16M7 12h10m-7 7h4"/></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19 8.2a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z"/></>,
  whatsapp: <><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.2-4.1a8.3 8.3 0 1 1 15-4.2Z"/><path d="M9 8.5c.2-.4.4-.4.6-.4h.3c.2 0 .3 0 .4.3l.6 1.3c.1.2.1.3 0 .5l-.4.5c-.1.2-.2.3 0 .5.4.7.9 1.2 1.6 1.6.2.1.3.1.5 0l.5-.4c.2-.2.3-.2.5-.1l1.3.6c.2.1.3.2.3.4v.3c0 .2-.1.4-.4.6-.4.2-.9.3-1.6.1-.7-.2-1.5-.6-2.3-1.5-.9-.8-1.3-1.6-1.5-2.3-.2-.7-.1-1.2.1-1.6Z"/></>,
  phone: <><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.5a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2.1Z"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  "check-circle": <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></>,
  sparkle: <><path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  building: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2A5 5 0 0 0 12 3.9l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 11.7-2L20 12M4 12l2.8 5A7 7 0 0 0 18.5 15"/></>,
  note: <><path d="M5 3h11l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M7 12h10M7 16h7"/></>,
  send: <><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></>,
  "users-round": <><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/></>,
  "calendar-days": <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></>,
  "file-text": <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
  save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
  sliders: <><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4"/></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
  "trend-up": <><path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  "circle-info": <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
};

export function AdminIcon({ name, size = 18, ...props }: Props) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" focusable="false" {...props}>
      {paths[name]}
    </svg>
  );
}
