"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { EnquiryTrigger } from "@/components/enquiry-trigger";
import { ArrowRightIcon, MenuIcon } from "@/components/icons";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <BrandMark />
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <nav id="primary-navigation" className={`site-nav${menuOpen ? " site-nav--open" : ""}`} aria-label="Main navigation">
          <Link href="/courses" onClick={close}>Explore courses</Link>
          <Link href="/#how" onClick={close}>How it works</Link>
          <Link href="/#why" onClick={close}>Why Edusaaathi</Link>
          <Link href="/#faqs" onClick={close}>FAQs</Link>
          <EnquiryTrigger className="site-nav__mobile-cta" onAfterOpen={close}>Get in touch <ArrowRightIcon /></EnquiryTrigger>
        </nav>
        <EnquiryTrigger className="button button--nav">Get in touch <ArrowRightIcon /></EnquiryTrigger>
      </div>
    </header>
  );
}
