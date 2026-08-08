import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from '@/lib/api-client';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const headersOfLastCall = (fetchMock: ReturnType<typeof vi.fn>) => {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
  return new Headers(init.headers);
};

describe('apiRequest', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Content-Type: application/json は CORS の単純リクエスト許容値ではないため、
  // ボディのない GET に付けるだけでプリフライト(OPTIONS)が先行し往復が倍になる。
  it('ボディがない場合は Content-Type を送らない', async () => {
    // Arrange & Act
    await apiRequest('/api/lobbies');

    // Assert
    expect(headersOfLastCall(fetchMock).has('Content-Type')).toBe(false);
  });

  it('ボディがない DELETE でも Content-Type を送らない', async () => {
    // Arrange & Act
    await apiRequest('/api/lobbies/1', { method: 'DELETE' });

    // Assert
    expect(headersOfLastCall(fetchMock).has('Content-Type')).toBe(false);
  });

  it('ボディがある場合は Content-Type を送る', async () => {
    // Arrange & Act
    await apiRequest('/api/lobbies', {
      method: 'POST',
      body: { title: 'テスト卓' },
    });

    // Assert
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(init.body).toBe(JSON.stringify({ title: 'テスト卓' }));
  });

  it('呼び出し側が渡したヘッダーはボディなしでも維持する', async () => {
    // Arrange & Act
    await apiRequest('/api/lobbies/1', {
      headers: { 'X-Guest-Token': 'token-1' },
    });

    // Assert
    expect(headersOfLastCall(fetchMock).get('X-Guest-Token')).toBe('token-1');
  });
});
