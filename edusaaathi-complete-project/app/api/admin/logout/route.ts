import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  JWT_ACCESS_COOKIE,
  JWT_REFRESH_COOKIE,
  ADMIN_USER_COOKIE,
} from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  const isProd = process.env.NODE_ENV === "production";

  const clearCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(ADMIN_COOKIE, "", clearCookieOptions);
  response.cookies.set(JWT_ACCESS_COOKIE, "", clearCookieOptions);
  response.cookies.set(JWT_REFRESH_COOKIE, "", clearCookieOptions);
  response.cookies.set(ADMIN_USER_COOKIE, "", {
    ...clearCookieOptions,
    httpOnly: false,
  });

  return response;
}
