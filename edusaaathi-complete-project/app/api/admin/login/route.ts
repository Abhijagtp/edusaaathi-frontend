import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  JWT_ACCESS_COOKIE,
  JWT_REFRESH_COOKIE,
  ADMIN_USER_COOKIE,
  createAdminToken,
  getBackendUrl,
  verifyAdminPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let email = "edusaathi@gmail.com";
  let password = "";

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    if (typeof body.email === "string" && body.email.trim()) {
      email = body.email.trim().toLowerCase();
    }
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Enter the admin email and password." }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const backendUrl = getBackendUrl();
  let jwtData: { access: string; refresh: string; user: Record<string, unknown> } | null = null;
  let backendErrorMessage: string | null = null;

  // 1. Attempt authentication with Django Docker Backend JWT
  try {
    const backendResponse = await fetch(`${backendUrl}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (backendResponse.ok) {
      jwtData = (await backendResponse.json()) as {
        access: string;
        refresh: string;
        user: Record<string, unknown>;
      };
    } else {
      const errorPayload = (await backendResponse.json().catch(() => ({}))) as Record<string, unknown>;
      backendErrorMessage =
        typeof errorPayload.detail === "string"
          ? errorPayload.detail
          : typeof errorPayload.error === "string"
          ? errorPayload.error
          : Array.isArray(errorPayload.non_field_errors)
          ? String(errorPayload.non_field_errors[0])
          : "Invalid credentials. Please verify email and password.";
    }
  } catch {
    // Backend may be connecting or unreachable; will evaluate local fallback below
  }

  // 2. Successful Django JWT Authentication
  if (jwtData && jwtData.access) {
    const { token, maxAge } = createAdminToken();
    const response = NextResponse.json({
      success: true,
      user: jwtData.user,
      message: "Admin authentication successful",
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set Next.js Admin Session Cookie
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge,
    });

    // Set Django JWT Access Token
    response.cookies.set(JWT_ACCESS_COOKIE, jwtData.access, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge,
    });

    // Set Django JWT Refresh Token
    if (jwtData.refresh) {
      response.cookies.set(JWT_REFRESH_COOKIE, jwtData.refresh, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Set readable user info cookie
    response.cookies.set(ADMIN_USER_COOKIE, encodeURIComponent(JSON.stringify(jwtData.user)), {
      httpOnly: false,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge,
    });

    return response;
  }

  // 3. Fallback verification for local developer preview / demo password
  if (verifyAdminPassword(password)) {
    const { token, maxAge } = createAdminToken();
    const fallbackUser = {
      email,
      role: "ADMIN",
      full_name: "EduSaathi Administrator",
    };
    const response = NextResponse.json({ success: true, user: fallbackUser });
    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge,
    });

    response.cookies.set(ADMIN_USER_COOKIE, encodeURIComponent(JSON.stringify(fallbackUser)), {
      httpOnly: false,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge,
    });

    return response;
  }

  // 4. Authentication failed
  return NextResponse.json(
    { error: backendErrorMessage || "The email or password did not match. Please try again." },
    { status: 401 }
  );
}
