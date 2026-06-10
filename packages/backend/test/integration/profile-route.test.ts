import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/app/presentation/controller/create-app';
import type { GameSessionUseCases } from '@/game-session/application/use-cases';
import type { ProfileUseCases } from '@/profile/application/use-cases';
import type { ProfileResponse } from '@taku-biyori/shared';
import type { GetProfileResult } from '@/profile/application/get-profile';
import type { UpdateProfileResult } from '@/profile/application/update-profile';

const mockSession = { user: { id: 'user-1' } };

const mockProfile: ProfileResponse = {
  id: 'user-1',
  name: 'テストユーザー',
  email: 'test@example.com',
  image: null,
};

const stubGameSession = {} as unknown as GameSessionUseCases;

const makeApp = (
  overrides: Partial<ProfileUseCases> & {
    getSession?: () => Promise<typeof mockSession | null>;
  } = {},
) =>
  createApp({
    frontendOrigin: 'http://localhost:5173',
    authHandler: vi.fn(async () => new Response('ok')),
    getSession: overrides.getSession ?? vi.fn().mockResolvedValue(mockSession),
    gameSession: stubGameSession,
    profile: {
      getProfile:
        overrides.getProfile ??
        vi.fn().mockResolvedValue({ type: 'ok', profile: mockProfile }),
      updateProfile:
        overrides.updateProfile ??
        vi.fn().mockResolvedValue({ type: 'ok', profile: mockProfile }),
    },
  });

describe('GET /api/profile', () => {
  it('認証済みなら 200 でプロフィールを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/profile');
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockProfile);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request('/api/profile');

    // Assert
    expect(response.status).toBe(401);
  });

  it('userId をユースケースに渡す', async () => {
    // Arrange
    const getProfile = vi
      .fn()
      .mockResolvedValue({ type: 'ok', profile: mockProfile });
    const app = makeApp({ getProfile });

    // Act
    await app.request('/api/profile');

    // Assert
    expect(getProfile).toHaveBeenCalledWith('user-1');
  });

  it('notFound なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      getProfile: vi.fn<() => Promise<GetProfileResult>>().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/profile');

    // Assert
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/profile', () => {
  it('有効なボディで 200 と更新後プロフィールを返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新しい名前' }),
    });
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockProfile);
  });

  it('未認証なら 401 を返す', async () => {
    // Arrange
    const app = makeApp({
      getSession: vi.fn().mockResolvedValue(null),
    });

    // Act
    const response = await app.request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新しい名前' }),
    });

    // Assert
    expect(response.status).toBe(401);
  });

  it('無効なボディで 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('不正な JSON ボディで 400 を返す', async () => {
    // Arrange
    const app = makeApp();

    // Act
    const response = await app.request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    });

    // Assert
    expect(response.status).toBe(400);
  });

  it('userId と入力をユースケースに渡す', async () => {
    // Arrange
    const updateProfile = vi
      .fn()
      .mockResolvedValue({ type: 'ok', profile: mockProfile });
    const app = makeApp({ updateProfile });

    // Act
    await app.request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '更新後' }),
    });

    // Assert
    expect(updateProfile).toHaveBeenCalledWith('user-1', { name: '更新後' });
  });

  it('notFound なら 404 を返す', async () => {
    // Arrange
    const app = makeApp({
      updateProfile: vi.fn<() => Promise<UpdateProfileResult>>().mockResolvedValue({ type: 'notFound' }),
    });

    // Act
    const response = await app.request('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '新しい名前' }),
    });

    // Assert
    expect(response.status).toBe(404);
  });
});
