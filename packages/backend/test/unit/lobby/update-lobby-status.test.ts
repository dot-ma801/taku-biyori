import { describe, expect, it, vi } from 'vitest';
import { updateLobbyStatus } from '@/lobby/application/update-lobby-status';
import type { UpdateLobbyStatusRepository } from '@/lobby/application/update-lobby-status';
import type { Lobby, LobbyStatusFacts } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

const TODAY = '2026-08-29';
const PUBLISHED_AT = new Date('2026-08-01T00:00:00.000Z');

const baseLobby: Lobby = {
  id: 'lobby-1',
  title: 'テストロビー',
  status: LobbyStatus.draft,
  publishedAt: null,
  receptionClosedAt: null,
  disbandedAt: null,
  hostUserId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const facts = {
  draft: {
    publishedAt: null,
    openUntil: null,
    receptionClosedAt: null,
    disbandedAt: null,
  },
  open: {
    publishedAt: PUBLISHED_AT,
    openUntil: null,
    receptionClosedAt: null,
    disbandedAt: null,
  },
  closed: {
    publishedAt: PUBLISHED_AT,
    openUntil: null,
    receptionClosedAt: new Date('2026-08-20T00:00:00.000Z'),
    disbandedAt: null,
  },
  disbanded: {
    publishedAt: PUBLISHED_AT,
    openUntil: null,
    receptionClosedAt: null,
    disbandedAt: new Date('2026-08-25T00:00:00.000Z'),
  },
} satisfies Record<string, LobbyStatusFacts>;

const makeRepo = (
  overrides: Partial<UpdateLobbyStatusRepository> = {},
): UpdateLobbyStatusRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue(facts.draft),
  findLobbyById: vi.fn().mockResolvedValue(baseLobby),
  publish: vi.fn().mockResolvedValue({
    ...baseLobby,
    status: LobbyStatus.open,
    publishedAt: PUBLISHED_AT.toISOString(),
  }),
  closeReception: vi.fn().mockResolvedValue({
    ...baseLobby,
    status: LobbyStatus.closed,
    publishedAt: PUBLISHED_AT.toISOString(),
    receptionClosedAt: '2026-08-29T00:00:00.000Z',
  }),
  reopenReception: vi.fn().mockResolvedValue({
    ...baseLobby,
    status: LobbyStatus.open,
    publishedAt: PUBLISHED_AT.toISOString(),
    receptionClosedAt: null,
  }),
  disband: vi.fn().mockResolvedValue({
    ...baseLobby,
    status: LobbyStatus.disbanded,
    disbandedAt: '2026-08-29T00:00:00.000Z',
  }),
  ...overrides,
});

describe('updateLobbyStatus', () => {
  describe('target: open', () => {
    it('draft からは公開する（published_at をセット）', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(facts.draft),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({
        type: 'ok',
        lobby: expect.objectContaining({ status: LobbyStatus.open }),
      });
      expect(repo.publish).toHaveBeenCalledWith('lobby-1');
      expect(repo.reopenReception).not.toHaveBeenCalled();
    });

    it('closed からは追加募集で受付を開き直す（reception_closed_at をクリア）', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(facts.closed),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({
        type: 'ok',
        lobby: expect.objectContaining({ status: LobbyStatus.open }),
      });
      expect(repo.reopenReception).toHaveBeenCalledWith('lobby-1');
      expect(repo.publish).not.toHaveBeenCalled();
    });

    it('すでに open なら書き込まずに成功する（冪等）', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(facts.open),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result.type).toBe('ok');
      expect(repo.publish).not.toHaveBeenCalled();
      expect(repo.reopenReception).not.toHaveBeenCalled();
    });
  });

  describe('target: closed', () => {
    it('open からは受付を閉じる（reception_closed_at をセット）', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(facts.open),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'closed' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({
        type: 'ok',
        lobby: expect.objectContaining({ status: LobbyStatus.closed }),
      });
      expect(repo.closeReception).toHaveBeenCalledWith('lobby-1');
    });

    it('すでに closed なら書き込まずに成功する（冪等）', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(facts.closed),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'closed' },
        TODAY,
      );

      // Assert
      expect(result.type).toBe('ok');
      expect(repo.closeReception).not.toHaveBeenCalled();
    });

    it('draft からは閉じられない（公開していない受付は閉じられない）', async () => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(facts.draft),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'closed' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
      expect(repo.closeReception).not.toHaveBeenCalled();
    });
  });

  describe('target: disbanded', () => {
    it.each([
      ['draft', facts.draft],
      ['open', facts.open],
      ['closed', facts.closed],
    ])('%s から解散できる', async (_label, statusFacts) => {
      // Arrange
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(statusFacts),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'disbanded' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({
        type: 'ok',
        lobby: expect.objectContaining({ status: LobbyStatus.disbanded }),
      });
      expect(repo.disband).toHaveBeenCalledWith('lobby-1');
    });
  });

  describe('disbanded は終端状態', () => {
    it.each(['open', 'closed', 'disbanded'] as const)(
      'disbanded から %s への遷移は invalidTransition',
      async (target) => {
        // Arrange
        const repo = makeRepo({
          findStatusFields: vi.fn().mockResolvedValue(facts.disbanded),
        });

        // Act
        const result = await updateLobbyStatus(
          repo,
          'lobby-1',
          'user-1',
          { status: target },
          TODAY,
        );

        // Assert
        expect(result).toEqual({ type: 'invalidTransition' });
        expect(repo.publish).not.toHaveBeenCalled();
        expect(repo.reopenReception).not.toHaveBeenCalled();
        expect(repo.closeReception).not.toHaveBeenCalled();
        expect(repo.disband).not.toHaveBeenCalled();
      },
    );
  });

  describe('権限と存在確認', () => {
    it('ロビーが存在しなければ notFound', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });

    it('ホスト以外は forbidden', async () => {
      // Arrange
      const repo = makeRepo({
        findHostUserId: vi.fn().mockResolvedValue('other-user'),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({ type: 'forbidden' });
    });
  });

  describe('条件付き UPDATE が0行だったとき', () => {
    it('行が残っていれば invalidTransition（並行する遷移に先を越された）', async () => {
      // Arrange
      const repo = makeRepo({
        publish: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidTransition' });
    });

    it('行ごと消えていれば notFound', async () => {
      // Arrange
      const findHostUserId = vi
        .fn()
        .mockResolvedValueOnce('user-1')
        .mockResolvedValueOnce(null);
      const repo = makeRepo({
        findHostUserId,
        publish: vi.fn().mockResolvedValue(null),
      });

      // Act
      const result = await updateLobbyStatus(
        repo,
        'lobby-1',
        'user-1',
        { status: 'open' },
        TODAY,
      );

      // Assert
      expect(result).toEqual({ type: 'notFound' });
    });
  });
});
