import { getAdminJwtToken, getBackendUrl } from "@/lib/auth";

export async function backendFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: any; error?: string }> {
  const baseUrl = getBackendUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const token = await getAdminJwtToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

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
