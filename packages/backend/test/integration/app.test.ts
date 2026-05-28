import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app/presentation/controller/create-app';

describe('createApp', () => {
  it('GET / で疎通確認を返す', async () => {
    // Arrange
    const app = createApp({
      frontendOrigin: 'http://localhost:5173',
      authHandler: vi.fn(async () => new Response('ok')),
    });

    // Act
    const response = await app.request('/');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'ok',
      message: 'Backend is running',
    });
  });

  it('認証リクエストを注入したハンドラへそのまま渡す', async () => {
    // Arrange
    const authHandler = vi.fn(async (request: Request) => {
      return new Response(
        JSON.stringify({
          method: request.method,
          path: new URL(request.url).pathname,
        }),
        {
          status: 201,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    });

    const app = createApp({
      frontendOrigin: 'http://localhost:5173',
      authHandler,
    });

    // Act
    const response = await app.request('/api/auth/sign-in', {
      method: 'POST',
    });
    const body = await response.json();

    // Assert
    expect(authHandler).toHaveBeenCalledTimes(1);
    expect(body).toEqual({
      method: 'POST',
      path: '/api/auth/sign-in',
    });
    expect(response.status).toBe(201);
  });
});
