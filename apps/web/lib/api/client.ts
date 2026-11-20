export type ApiError = { message?: string | string[]; errors?: unknown; statusCode?: number };

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}/api${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = (data ?? {}) as ApiError;
    const message =
      Array.isArray(err.message) ? err.message.join(", ") : err.message ?? `Request failed (${res.status})`;
    const apiErr = new Error(message) as Error & { statusCode?: number; errors?: unknown };
    apiErr.statusCode = res.status;
    apiErr.errors = err.errors;
    throw apiErr;
  }
const unwrapped = data as { data?: T } | undefined;
return (unwrapped?.data ?? data) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
