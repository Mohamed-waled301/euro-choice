import { isDemoMode, getDemoResponse } from './demoMode';

let accessToken: string | null = localStorage.getItem('ec_access_token');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('ec_access_token', token);
  } else {
    localStorage.removeItem('ec_access_token');
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  // If Demo mode is active, directly simulate backend response
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return getDemoResponse(endpoint, options);
  }

  const { params, headers = {}, ...customConfig } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (accessToken) {
    reqHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: reqHeaders,
    credentials: 'include', // for refresh token cookie
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    // Attempt token refresh
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);
        reqHeaders['Authorization'] = `Bearer ${refreshData.accessToken}`;
        // Retry original request
        const retryRes = await fetch(url, {
          ...customConfig,
          headers: reqHeaders,
          credentials: 'include',
        });
        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Request failed with status ${retryRes.status}`);
        }
        return retryRes.json();
      } else {
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:logout'));
      }
    } catch {
      setAccessToken(null);
      window.dispatchEvent(new Event('auth:logout'));
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.error?.message ||
      (errorData.error?.fields ? Object.values(errorData.error.fields).join(', ') : null) ||
      `Request failed with status ${response.status}`;
    const err: any = new Error(message);
    err.code = errorData.error?.code;
    err.fields = errorData.error?.fields;
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => apiClient<T>(url, { method: 'GET', params }),
  post: <T = any>(url: string, body?: any) =>
    apiClient<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(url: string, body?: any) =>
    apiClient<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) => apiClient<T>(url, { method: 'DELETE' }),
};
