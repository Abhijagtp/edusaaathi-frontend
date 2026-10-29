import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  JWT_ACCESS_COOKIE,
  JWT_REFRESH_COOKIE,
  ADMIN_COOKIE,
  ADMIN_USER_COOKIE,
  getBackendUrl,
  createAdminToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Token Refresh API Route Handler
 * Intercepts or receives client-side refresh triggers, calls Django SimpleJWT TokenRefreshView,
 * updates HTTP-only access & refresh cookies, and keeps the session alive.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(JWT_REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token available." }, { status: 401 });
  }

  const backendUrl = getBackendUrl();
  try {
    const backendRes = await fetch(`${backendUrl}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });

    if (!backendRes.ok) {
      // Refresh token is expired or blacklisted
      const response = NextResponse.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
      response.cookies.delete(JWT_ACCESS_COOKIE);
      response.cookies.delete(JWT_REFRESH_COOKIE);
      response.cookies.delete(ADMIN_COOKIE);
      response.cookies.delete(ADMIN_USER_COOKIE);
      return response;
    }

    const data = (await backendRes.json()) as { access: string; refresh?: string };
    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      message: "Access token refreshed successfully.",
    });

    // Update Access Token cookie
    response.cookies.set(JWT_ACCESS_COOKIE, data.access, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    // If rotated, update Refresh Token cookie
    if (data.refresh) {
      response.cookies.set(JWT_REFRESH_COOKIE, data.refresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Extend the Next.js admin cookie signature
    const { token, maxAge } = createAdminToken();
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to reach authentication service." },
      { status: 503 }
    );
  }
}
