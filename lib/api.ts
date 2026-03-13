const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  meta: {
    requestId: string;
    path: string;
    pagination?: PaginationMeta;
  };
}

interface ApiError {
  ok: false;
  error: {
    code: number;
    message: string;
    details: unknown;
  };
  meta: {
    requestId: string;
    path: string;
  };
}

export class ApiException extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

// Prevent multiple concurrent refresh calls from racing
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function handleResponse<T>(
  res: globalThis.Response,
  path: string,
  options: RequestInit,
  isRetry: boolean,
): Promise<ApiResponse<T>> {
  // On 401, try refreshing the token before giving up
  if (res.status === 401 && !isRetry && !path.startsWith("/auth/")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
      });
      return handleResponse<T>(retryRes, path, options, true);
    }
    redirectToLogin();
    throw new ApiException(401, "Session expired");
  }

  const json = await res.json();

  if (!json.ok) {
    const err = json as ApiError;
    if (err.error.code === 401) {
      redirectToLogin();
    }
    throw new ApiException(err.error.code, err.error.message, err.error.details);
  }

  return json as ApiResponse<T>;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  return handleResponse<T>(res, path, fetchOptions, false);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const fetchOptions: RequestInit = {
    method: "POST",
    credentials: "include",
    body: formData,
  };

  const res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  return handleResponse<T>(res, path, fetchOptions, false);
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
