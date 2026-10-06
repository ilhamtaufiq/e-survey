// Helper fetch ke APIAMIS (Laravel). Workers-safe: hanya Web API (fetch/FormData).
import { getApiBase } from './env';
import type { PortalUser } from '../survey';

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function parseError(res: Response): Promise<ApiError> {
  const status = res.status;
  let message = `Permintaan gagal (${status})`;
  let errors: Record<string, string[]> | undefined;
  try {
    const data = (await res.json()) as { message?: string; errors?: Record<string, string[]> };
    if (typeof data?.message === 'string' && data.message) message = data.message;
    if (data?.errors) errors = data.errors;
  } catch {
    try {
      const text = await res.text();
      if (text) message = text.slice(0, 500);
    } catch {
      // abaikan
    }
  }
  return new ApiError(status, message, errors);
}

type ApiOptions = {
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
};

function withQuery(url: string, query?: ApiOptions['query']): string {
  if (!query) return url;
  const u = new URL(url);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function request<T>(
  base: string,
  method: string,
  path: string,
  token: string | null | undefined,
  opts: ApiOptions = {},
): Promise<T> {
  const url = withQuery(joinUrl(base, path), opts.query);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData as BodyInit;
    // Jangan set Content-Type manual untuk FormData (boundary otomatis).
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(url, { method, headers, body });
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function apiGet<T>(
  base: string,
  path: string,
  token?: string | null,
  query?: ApiOptions['query'],
): Promise<T> {
  return request<T>(base, 'GET', path, token, { query });
}

export async function apiPost<T>(
  base: string,
  path: string,
  token: string | null | undefined,
  opts: ApiOptions = {},
): Promise<T> {
  return request<T>(base, 'POST', path, token, opts);
}

export async function apiPut<T>(
  base: string,
  path: string,
  token: string | null | undefined,
  opts: ApiOptions = {},
): Promise<T> {
  // Laravel: dukung _method spoofing bila backend pakai form; di sini PUT langsung.
  return request<T>(base, 'PUT', path, token, opts);
}

export async function apiDelete<T>(base: string, path: string, token?: string | null): Promise<T> {
  return request<T>(base, 'DELETE', path, token);
}

export async function apiExchangeCode(
  base: string,
  code: string,
): Promise<{ user: PortalUser; token: string }> {
  return request<{ user: PortalUser; token: string }>(base, 'POST', '/auth/handoff/exchange', undefined, {
    body: { code },
  });
}

export async function apiMe(base: string, token: string): Promise<PortalUser> {
  // Kontrak: GET /api/auth/me → user langsung ATAU {data: user} ATAU {user}
  const raw = await request<unknown>(base, 'GET', '/auth/me', token);
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (o['user'] && typeof o['user'] === 'object') return o['user'] as PortalUser;
    if (o['data'] && typeof o['data'] === 'object') return o['data'] as PortalUser;
  }
  return raw as PortalUser;
}

export async function apiLogout(base: string, token: string): Promise<void> {
  try {
    await request<unknown>(base, 'POST', '/auth/logout', token);
  } catch {
    // best effort
  }
}

export function apiBaseFromLocals(locals: App.Locals): string {
  return getApiBase(locals);
}
