const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public body?: unknown;

  constructor(
    status: number,
    statusText: string,
    body?: unknown,
  ) {
    super(`API error: ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // response may not be JSON
    }
    throw new ApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export default apiClient;
