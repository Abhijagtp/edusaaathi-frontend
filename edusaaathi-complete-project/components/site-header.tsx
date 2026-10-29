"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { EnquiryTrigger } from "@/components/enquiry-trigger";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/icons";
import { getWhatsAppHref } from "@/lib/config";

const NAV_ITEMS = [
  { href: "/courses", label: "Explore courses", badge: "01" },
  { href: "/#how", label: "How it works", badge: "02" },
  { href: "/#why", label: "Why Edusaaathi", badge: "03" },
  { href: "/#faqs", label: "FAQs", badge: "04" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const whatsappHref = getWhatsAppHref("Hi Edusaaathi, I would like to get guidance on courses and admissions.");

  const close = () => setMenuOpen(false);

  // Auto-close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll and handle Escape key when menu is open
  useEffect(() => {
    if (!menuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <BrandMark />

          <button
            className={`menu-toggle ${menuOpen ? "menu-toggle--active" : ""}`}
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="menu-burger" aria-hidden="true">
              <span className="menu-burger__bar menu-burger__bar--top" />
              <span className="menu-burger__bar menu-burger__bar--mid" />
              <span className="menu-burger__bar menu-burger__bar--bot" />
            </span>
          </button>

          <nav
            id="primary-navigation"
            className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}
            aria-label="Main navigation"
          >
            <div className="site-nav__links">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="site-nav__link"
                  onClick={close}
                >
                  <span className="site-nav__badge" aria-hidden="true">{item.badge}</span>
                  <span className="site-nav__title">{item.label}</span>
                  <span className="site-nav__arrow" aria-hidden="true">
                    <ArrowRightIcon />
                  </span>
                </Link>
              ))}
            </div>

            <div className="site-nav__actions">
              <EnquiryTrigger className="site-nav__mobile-cta" onAfterOpen={close}>
                <span>Get free counselling</span>
                <ArrowRightIcon />
              </EnquiryTrigger>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="site-nav__mobile-whatsapp"
                onClick={close}
              >
                <span className="site-nav__mobile-whatsapp-icon" aria-hidden="true">
                  <WhatsAppIcon />
                </span>
                <span>Chat with Counsellor</span>
              </a>

              <div className="site-nav__trust-badge">
                <span className="site-nav__trust-dot" />
                <span>Free Guidance • Fast Response • UGC Recognized</span>
              </div>
            </div>
          </nav>

          <EnquiryTrigger className="button button--nav">
            Get in touch <ArrowRightIcon />
          </EnquiryTrigger>
        </div>
      </header>

      {/* Backdrop scrim to close menu on outside tap */}
      <div
        className={`site-nav-scrim ${menuOpen ? "site-nav-scrim--open" : ""}`}
        onClick={close}
        aria-hidden="true"
      />
    </>
  );
}
