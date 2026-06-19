export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  field?: string;
  details?: Record<string, string>;

  constructor(message: string, opts: { status: number; code?: string; field?: string; details?: Record<string, string> }) {
    super(message);
    this.status = opts.status;
    this.code = opts.code;
    this.field = opts.field;
    this.details = opts.details;
  }
}

function readTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token');
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = opts.token ?? readTokenFromStorage();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (payload && (payload.error as string)) || `Error ${res.status}`;
    throw new ApiError(message, {
      status: res.status,
      code: payload?.code,
      field: payload?.field,
      details: payload?.details,
    });
  }
  return payload as T;
}
