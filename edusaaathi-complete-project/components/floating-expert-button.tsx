"use client";

import { WhatsAppIcon } from "@/components/icons";
import { getWhatsAppHref } from "@/lib/config";

export function FloatingExpertButton() {
  const whatsappHref = getWhatsAppHref(
    "Hi Edusaaathi, I would like to talk to an expert about course and admission guidance."
  );

  return (
    <aside aria-label="Quick WhatsApp contact" className="floating-expert-wrap">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-whatsapp-btn"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <span className="floating-whatsapp-btn__pulse" aria-hidden="true" />
        <span className="floating-whatsapp-btn__icon" aria-hidden="true">
          <WhatsAppIcon />
        </span>
      </a>
    </aside>
  );
}
