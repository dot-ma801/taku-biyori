const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.error === 'string') return body.error;
    if (typeof body.error?.message === 'string') return body.error.message;
  } catch {
    // fallthrough
  }
  return res.statusText || 'エラーが発生しました';
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T | undefined> {
  const { body, headers, ...rest } = options;
  const hasBody = body != null;

  const res = await fetch(`${apiUrl}${path}`, {
    credentials: 'include',
    headers: {
      // Content-Type: application/json は CORS の単純リクエスト許容値ではないため、
      // ボディのない GET/DELETE に付けるとプリフライト(OPTIONS)が先行して往復が倍になる。
      // 実際に JSON を送るときだけ付ける。
      ...(hasBody && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!res.ok) {
    const message = await parseErrorMessage(res);
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined;
  }

  return res.json() as Promise<T>;
}
