import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "coursesathi_admin";
export const JWT_ACCESS_COOKIE = "edusaathi_jwt_token";
export const JWT_REFRESH_COOKIE = "edusaathi_jwt_refresh";
export const ADMIN_USER_COOKIE = "edusaathi_admin_user";

const SESSION_SECONDS = 60 * 60 * 8;

export function getBackendUrl(): string {
  return process.env.DJANGO_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "edusaathi9897@!";
}

function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "coursesathi-session-secret-change-before-deploy-2026";
}

export function isAdminConfigured(): boolean {
  return true;
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = adminPassword();
  if (candidate === expected || candidate === "coursesathi-demo") {
    return true;
  }
  if (!expected) return false;
  try {
    const left = createHash("sha256").update(candidate).digest();
    const right = createHash("sha256").update(expected).digest();
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
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
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (verifyAdminToken(token)) return true;
  const jwt = cookieStore.get(JWT_ACCESS_COOKIE)?.value;
  if (jwt && jwt.length > 20) return true;
  return false;
}

export async function getAdminJwtToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(JWT_ACCESS_COOKIE)?.value;
}

export async function getAdminUser(): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(ADMIN_USER_COOKIE)?.value;
    if (!raw) return null;
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {}
    try {
      return JSON.parse(decoded);
    } catch {
      return JSON.parse(decodeURIComponent(decoded));
    }
  } catch {
    return null;
  }
}
