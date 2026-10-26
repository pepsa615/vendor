export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}
function resolveBaseUrl(): string {
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "vendor-sandbox.pepsa.co" || host.includes("sandbox")) {
      return "https://vendorsandbox-api.pepsa.co/api/v1";
    }
    if (
      host === "vendor.pepsa.co" ||
      (!host.includes("localhost") &&
        !host.includes("127.0.0.1") &&
        host.endsWith("pepsa.co"))
    ) {
      return "https://vendor-api.pepsa.co/api/v1";
    }
  }
  return import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
}

const baseUrl = resolveBaseUrl();
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

async function refresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "x-request-id": crypto.randomUUID(),
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          accessToken = null;
          return false;
        }
        const body = (await response.json()) as { accessToken: string };
        accessToken = body.accessToken;
        return true;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function bootstrapSession<T>(): Promise<T | null> {
  if (!(await refresh())) return null;
  return apiRequest<T>("/auth/me", { retryAuth: false });
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & {
    token?: string;
    signal?: AbortSignal;
    retryAuth?: boolean;
  } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("x-request-id", crypto.randomUUID());
  const token = init.token ?? accessToken;
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("content-type")
  )
    headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (
    response.status === 401 &&
    init.retryAuth !== false &&
    !path.startsWith("/auth/")
  ) {
    if (await refresh())
      return apiRequest<T>(path, { ...init, retryAuth: false });
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: ApiError;
    } | null;
    throw (
      body?.error ?? {
        code: "NETWORK_ERROR",
        message: "Request failed",
        requestId: response.headers.get("x-request-id") ?? "unknown",
      }
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiDownload(path: string): Promise<Blob> {
  const headers = new Headers({
    accept: "application/pdf,text/csv",
    "x-request-id": crypto.randomUUID(),
  });
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  let response = await fetch(`${baseUrl}${path}`, {
    headers,
    credentials: "include",
  });
  if (response.status === 401 && (await refresh())) {
    if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
    response = await fetch(`${baseUrl}${path}`, {
      headers,
      credentials: "include",
    });
  }
  if (!response.ok) throw new Error("Unable to download file");
  return response.blob();
}
