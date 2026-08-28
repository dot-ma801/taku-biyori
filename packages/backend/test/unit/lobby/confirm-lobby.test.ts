import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';
import {
  confirmLobby,
  type ConfirmLobbyRepository,
} from '@/lobby/application/confirm-lobby';

const now = new Date('2026-07-11T10:00:00.000Z');

const mockGameSession: GameSession = {
  id: 'game-session-1',
  title: 'テスト募集',
  status: GameSessionStatus.confirmed,
  isPublished: true,
  scheduledAt: '2026-07-20',
  lobbyId: 'lobby-1',
  createdBy: 'host-1',
  createdAt: '2026-07-11T10:00:00.000Z',
  updatedAt: '2026-07-11T10:00:00.000Z',
};

const openStatusFields = {
  isPublished: true,
  openUntil: null,
  closedAt: null,
  cancelledAt: null,
};

const makeRepo = (
  overrides: Partial<ConfirmLobbyRepository> = {},
): ConfirmLobbyRepository => {
  const repo: ConfirmLobbyRepository = {
    findHostUserId: vi.fn().mockResolvedValue('host-1'),
    findStatusFields: vi.fn().mockResolvedValue(openStatusFields),
    findLobbyCore: vi.fn().mockResolvedValue({
      hostUserId: 'host-1',
      title: 'テスト募集',
      scenarioName: null,
      description: null,
      location: null,
      maxPlayers: null,
    }),
    findCandidateOwner: vi
      .fn()
      .mockResolvedValue({ lobbyId: 'lobby-1', date: '2026-07-20' }),
    findMemberCoresByIds: vi
      .fn()
      .mockResolvedValue([
        { id: 'member-1', userId: 'user-2', guestName: null },
      ]),
    createGameSessionFromLobby: vi.fn().mockResolvedValue(mockGameSession),
    closeLobby: vi.fn().mockResolvedValue(true),
    executeWithLock: vi.fn().mockImplementation((_id, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

describe('confirmLobby', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ホストが確定できる（ok・作成された卓を返す）', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: mockGameSession });
  });

  it('募集枠が存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外の実行は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'other-user',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.createGameSessionFromLobby).not.toHaveBeenCalled();
  });

  it.each(['draft', 'cancelled'] as const)(
    'ステータスが %s の場合は invalidStatus（422 相当）を返す',
    async (status) => {
      // Arrange
      const fields =
        status === 'draft'
          ? {
              isPublished: false,
              openUntil: null,
              closedAt: null,
              cancelledAt: null,
            }
          : {
              isPublished: true,
              openUntil: null,
              closedAt: null,
              cancelledAt: new Date('2026-07-01'),
            };
      const repo = makeRepo({
        findStatusFields: vi.fn().mockResolvedValue(fields),
      });

      // Act
      const result = await confirmLobby(
        repo,
        'lobby-1',
        'host-1',
        { candidateId: 'date-1', memberIds: ['member-1'] },
        now,
      );

      // Assert
      expect(result).toEqual({ type: 'invalidStatus' });
      expect(repo.createGameSessionFromLobby).not.toHaveBeenCalled();
    },
  );

  it('scheduling ステータスからも確定できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: new Date('2026-07-01'),
        closedAt: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result.type).toBe('ok');
  });

  it('既に確定済み（confirmed）の場合は conflict（409 相当）を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: null,
        closedAt: new Date('2026-07-01'),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'conflict' });
    expect(repo.createGameSessionFromLobby).not.toHaveBeenCalled();
  });

  it('candidateId がこの募集枠の候補日でない場合は candidateNotFound（404 相当）を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'candidateNotFound' });
  });

  it('candidateId が別の募集枠のものである場合は candidateNotFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi
        .fn()
        .mockResolvedValue({ lobbyId: 'other-lobby', date: '2026-07-20' }),
    });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'candidateNotFound' });
  });

  it('memberIds にこの募集枠のメンバーでない ID を含む場合は invalidMembers（422 相当）を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberCoresByIds: vi
        .fn()
        .mockResolvedValue([
          { id: 'member-1', userId: 'user-2', guestName: null },
        ]),
    });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1', 'not-a-member'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'invalidMembers' });
    expect(repo.createGameSessionFromLobby).not.toHaveBeenCalled();
  });

  it('closeLobby が false（並行確定に敗北・中止と衝突）の場合は conflict を返す', async () => {
    // Arrange
    const repo = makeRepo({ closeLobby: vi.fn().mockResolvedValue(false) });

    // Act
    const result = await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(result).toEqual({ type: 'conflict' });
  });

  it('募集枠のタイトル・シナリオ名等をコピーして卓を作成する', async () => {
    // Arrange
    const createGameSessionFromLobby = vi
      .fn()
      .mockResolvedValue(mockGameSession);
    const repo = makeRepo({
      findLobbyCore: vi.fn().mockResolvedValue({
        hostUserId: 'host-1',
        title: '募集タイトル',
        scenarioName: 'シナリオA',
        description: '説明文',
        location: '会場',
        maxPlayers: 5,
      }),
      createGameSessionFromLobby,
    });

    // Act
    await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(createGameSessionFromLobby).toHaveBeenCalledWith(
      expect.objectContaining({
        lobbyId: 'lobby-1',
        hostUserId: 'host-1',
        title: '募集タイトル',
        scenarioName: 'シナリオA',
        description: '説明文',
        location: '会場',
        maxPlayers: 5,
        scheduledAt: '2026-07-20',
        members: [{ id: 'member-1', userId: 'user-2', guestName: null }],
      }),
    );
  });

  it('確定のたびに新しい guestLinkToken を生成する（募集枠のトークンは使い回さない）', async () => {
    // Arrange
    const createGameSessionFromLobby = vi
      .fn()
      .mockResolvedValue(mockGameSession);
    const repo = makeRepo({ createGameSessionFromLobby });

    // Act
    await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    const call = createGameSessionFromLobby.mock.calls[0]![0];
    expect(typeof call.guestLinkToken).toBe('string');
    expect(call.guestLinkToken.length).toBeGreaterThan(0);
  });

  it('ロック（executeWithLock）内でバリデーション・作成・クローズを行う', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await confirmLobby(
      repo,
      'lobby-1',
      'host-1',
      { candidateId: 'date-1', memberIds: ['member-1'] },
      now,
    );

    // Assert
    expect(repo.executeWithLock).toHaveBeenCalledWith(
      'lobby-1',
      expect.any(Function),
    );
  });
});
