/**
 * Client-Side HTTP Fetch Interceptor with Automatic JWT Token Refresh
 *
 * Intercepts outgoing client requests to Next.js API routes (/api/admin, /api/consultant, etc.).
 * When any request returns a 401 Unauthorized status (due to an expired access token),
 * the interceptor:
 *   1. Queues any concurrent calls.
 *   2. Automatically requests a token refresh at /api/admin/refresh.
 *   3. If refresh succeeds: Retries the original request seamlessly.
 *   4. If refresh fails: Clears the demo session and redirects to /admin/login.
 */

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function onTokenRefreshed(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback);
}

export async function interceptedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // If unauthorized, intercept and attempt token refresh
  if (response.status === 401) {
    const urlString = typeof input === "string" ? input : input.toString();

    // Avoid intercepting auth lifecycle routes themselves
    if (
      urlString.includes("/api/admin/login") ||
      urlString.includes("/api/admin/refresh") ||
      urlString.includes("/api/admin/logout")
    ) {
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch("/api/admin/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          onTokenRefreshed(true);
          // Retry original request with newly issued cookie
          return fetch(input, init);
        } else {
          isRefreshing = false;
          onTokenRefreshed(false);
          if (typeof window !== "undefined") {
            try {
              window.sessionStorage.removeItem("coursesathi-adminuser-demo-session-v1");
            } catch {}
          }
          return response;
        }
      } catch {
        isRefreshing = false;
        onTokenRefreshed(false);
        return response;
      }
    }

    // A refresh is already in progress; wait for it to complete then retry
    return new Promise<Response>((resolve) => {
      addRefreshSubscriber((success: boolean) => {
        if (success) {
          resolve(fetch(input, init));
        } else {
          resolve(response);
        }
      });
    });
  }

  return response;
}
