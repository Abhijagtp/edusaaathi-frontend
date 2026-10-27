export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://coursesathi.in").replace(/\/$/, "");
export const SITE_NAME = "Edusaaathi";
export const SITE_DESCRIPTION =
  "Explore courses, understand eligibility and take your next step with Edusaaathi education guidance.";

export function getWhatsAppHref(message: string): string {
  const configuredNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return configuredNumber
    ? `https://wa.me/${configuredNumber}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

export function getContactEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return value || null;
}
