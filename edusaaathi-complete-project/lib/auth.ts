import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "coursesathi_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "coursesathi-demo" : "");
}

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ||
    (process.env.NODE_ENV !== "production" ? "coursesathi-local-session-secret-change-before-deploy" : "");
}

export function isAdminConfigured(): boolean {
  return Boolean(adminPassword() && sessionSecret());
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const left = createHash("sha256").update(candidate).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function createAdminToken(): { token: string; maxAge: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const signature = createHmac("sha256", sessionSecret()).update(String(expiresAt)).digest("hex");
  return { token: `${expiresAt}.${signature}`, maxAge: SESSION_SECONDS };
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !sessionSecret()) return false;
  const [expiryText, providedSignature, extra] = token.split(".");
  if (!expiryText || !providedSignature || extra) return false;
  const expiry = Number(expiryText);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) return false;
  const expectedSignature = createHmac("sha256", sessionSecret()).update(expiryText).digest("hex");
  const provided = Buffer.from(providedSignature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function hasAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}
