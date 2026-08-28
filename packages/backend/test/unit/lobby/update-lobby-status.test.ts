import { describe, expect, it, vi } from 'vitest';
import { updateLobbyStatus } from '@/lobby/application/update-lobby-status';
import type { UpdateLobbyStatusRepository } from '@/lobby/application/update-lobby-status';
import type { Lobby } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const baseLobby: Lobby = {
  id: 'lobby-1',
  title: 'テスト募集',
  status: LobbyStatus.draft,
  isPublished: false,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpdateLobbyStatusRepository> = {},
): UpdateLobbyStatusRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: false,
    openUntil: null,
    cancelledAt: null,
  }),
  publish: vi
    .fn()
    .mockResolvedValue({ ...baseLobby, status: 'open', isPublished: true }),
  cancel: vi.fn().mockResolvedValue({
    ...baseLobby,
    status: 'cancelled',
    cancelledAt: '2025-01-01T00:00:00.000Z',
  }),
  ...overrides,
});

describe('updateLobbyStatus', () => {
  describe('draft → open（公開）', () => {
    it('ホストが draft → open に遷移できる', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'open',
      });

      // Assert
      expect(result).toEqual({
        type: 'ok',
        lobby: expect.objectContaining({ status: 'open' }),
      });
    });

    it('publish を呼び出す', async () => {
      // Arrange
      const repo = makeRepo();

      // Act
      await updateLobbyStatus(repo, 'lobby-1', 'user-1', { status: 'open' });

      // Assert
      expect(repo.publish).toHaveBeenCalledWith('lobby-1');
    });

    it('draft 以外から open に遷移しようとすると invalidTransition を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: null,
          cancelledAt: null,
        }),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'open',
      });

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
      expect(repo.publish).not.toHaveBeenCalled();
    });
  });

  describe('募集中止（cancelled）', () => {
    it('draft から中止できる', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: false,
          openUntil: null,
          cancelledAt: null,
        }),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'cancelled',
      });

      // Assert
      expect(result).toEqual({
        type: 'ok',
        lobby: expect.objectContaining({ status: 'cancelled' }),
      });
      expect(repo.cancel).toHaveBeenCalledWith('lobby-1');
    });

    it('open から中止できる', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: null,
          cancelledAt: null,
        }),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'cancelled',
      });

      // Assert
      expect(result.type).toBe('ok');
    });

    it('scheduling から中止できる', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: new Date('2000-01-01'),
          cancelledAt: null,
        }),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'cancelled',
      });

      // Assert
      expect(result.type).toBe('ok');
    });

    it('既に cancelled の場合（二重中止）は invalidTransition を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue({
          isPublished: true,
          openUntil: null,
          cancelledAt: new Date('2025-01-01'),
        }),
        cancel: vi.fn(),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'cancelled',
      });

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
      expect(repo.cancel).not.toHaveBeenCalled();
    });
  });

  describe('権限・存在チェック', () => {
    it('募集枠が存在しない場合は notFound を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'nonexistent', 'user-1', {
        status: 'open',
      });

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });

    it('ホストでないユーザーは forbidden を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi.fn().mockResolvedValue('user-1'),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-other', {
        status: 'open',
      });

      // Assert
      expect(result).toEqual({ type: 'forbidden' });
    });

    // 条件付き UPDATE が 0 行（null）のとき、行が存在するなら並行する遷移に
    // 先を越されたケースなので invalidTransition（409）、行が消えているなら notFound。
    it('publish が null を返し行が存在する場合は invalidTransition を返す', async () => {
      // Arrange
      const repo = makeRepo({ publish: vi.fn().mockResolvedValue(null) });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'open',
      });

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
    });

    it('publish が null を返し行が消えている場合は notFound を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi
          .fn()
          .mockResolvedValueOnce('user-1') // 権限チェック時は存在
          .mockResolvedValueOnce(null), // 再確認時には削除済み
        publish: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'open',
      });

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });

    it('cancel が null を返し行が存在する場合（並行確定に敗北）は invalidTransition を返す', async () => {
      // Arrange
      const repo = makeRepo({ cancel: vi.fn().mockResolvedValue(null) });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'cancelled',
      });

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
    });

    it('cancel が null を返し行が消えている場合は notFound を返す', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi
          .fn()
          .mockResolvedValueOnce('user-1')
          .mockResolvedValueOnce(null),
        cancel: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateLobbyStatus(repo, 'lobby-1', 'user-1', {
        status: 'cancelled',
      });

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });
  });
});
