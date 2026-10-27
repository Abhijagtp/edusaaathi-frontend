"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  courseSlug?: string;
  onAfterOpen?: () => void;
};

export function EnquiryTrigger({ children, courseSlug, onAfterOpen, ...props }: Props) {
  function openEnquiry() {
    window.dispatchEvent(new CustomEvent("coursesathi:open-enquiry", { detail: { courseSlug } }));
    onAfterOpen?.();
  }
  return <button type="button" onClick={openEnquiry} {...props}>{children}</button>;
}
