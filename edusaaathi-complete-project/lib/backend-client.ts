import {
  getAdminJwtToken,
  getAdminRefreshToken,
  setAdminJwtTokens,
  clearAdminSession,
  getBackendUrl,
} from "@/lib/auth";

/**
 * Server-side Interceptor for Django REST Framework
 * 1. Request Interceptor: Automatically injects Authorization: Bearer <access_token>.
 * 2. Response Interceptor: Catches 401 Unauthorized responses, transparently exchanges
 *    the refresh token for a new access token, updates HTTP cookies, and retries the
 *    original request seamlessly.
 */
export async function backendFetch(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const baseUrl = getBackendUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  let token = await getAdminJwtToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // 1. Request Interceptor: Inject current JWT access token
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    let data: any = null;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => "");
      data = { text };
    }

    // 2. Response Interceptor: If 401 Unauthorized, intercept and refresh token
    const isUnauthorized =
      res.status === 401 &&
      !isRetry &&
      !endpoint.includes("/token/refresh") &&
      !endpoint.includes("/login");

    if (isUnauthorized) {
      const refreshToken = await getAdminRefreshToken();

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${baseUrl}/api/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
            cache: "no-store",
          });

          if (refreshRes.ok) {
            const refreshData = (await refreshRes.json()) as { access: string; refresh?: string };
            const newAccessToken = refreshData.access;
            const newRefreshToken = refreshData.refresh;

            // Update Next.js session cookies
            await setAdminJwtTokens(newAccessToken, newRefreshToken);

            // Retry original request with newly minted access token
            const retryHeaders: Record<string, string> = {
              ...headers,
              Authorization: `Bearer ${newAccessToken}`,
            };

            return backendFetch(endpoint, { ...options, headers: retryHeaders }, true);
          } else {
            // Refresh token is expired or invalid -> clear cookies
            await clearAdminSession();
            return {
              ok: false,
              status: 401,
              data,
              error: "Session expired. Please sign in again.",
            };
          }
        } catch {
          // Fall through to standard error handling
        }
      }
    }

    if (!res.ok) {
      const errorMsg =
        data?.detail ||
        data?.error ||
        data?.message ||
        (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
        `Backend returned status ${res.status}`;
      return { ok: false, status: res.status, data, error: errorMsg };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 503,
      data: null,
      error: err?.message || "Failed to reach Django backend server.",
    };
  }
}
