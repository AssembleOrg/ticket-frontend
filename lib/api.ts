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

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!json.ok) {
    const err = json as ApiError;
    throw new ApiException(
      err.error.code,
      err.error.message,
      err.error.details,
    );
  }

  return json as ApiResponse<T>;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const json = await res.json();

  if (!json.ok) {
    const err = json as ApiError;
    throw new ApiException(
      err.error.code,
      err.error.message,
      err.error.details,
    );
  }

  return json as ApiResponse<T>;
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
