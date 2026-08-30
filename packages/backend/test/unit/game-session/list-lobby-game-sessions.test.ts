import { describe, expect, it, vi } from 'vitest';
import { listLobbyGameSessions } from '@/game-session/application/list-lobby-game-sessions';
import type { ListLobbyGameSessionsRepository } from '@/game-session/application/list-lobby-game-sessions';
import type { GameSessionListItem } from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';

const item = (id: string): GameSessionListItem => ({
  id,
  lobbyId: LOBBY_ID,
  title: 'マダミス「蒼き月」',
  scenarioName: '蒼き月の夜',
  status: GameSessionStatus.scheduled,
  scheduledAt: '2026-09-01',
  timeLabel: null,
  seats: [],
  hostUserId: 'user-host',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
});

const makeRepo = (
  overrides: Partial<ListLobbyGameSessionsRepository> = {},
): ListLobbyGameSessionsRepository => ({
  findLobbyForViewing: vi
    .fn()
    .mockResolvedValue({ hostUserId: 'user-host', status: LobbyStatus.open }),
  findByLobbyId: vi.fn().mockResolvedValue([item('session-1')]),
  ...overrides,
});

describe('listLobbyGameSessions', () => {
  it('公開ロビーの開催一覧は未ログインでも取得できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listLobbyGameSessions(repo, LOBBY_ID, null);

    // Assert
    expect(result).toEqual({ type: 'ok', gameSessions: [item('session-1')] });
  });

  it('ロビーが無ければ notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForViewing: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listLobbyGameSessions(repo, LOBBY_ID, null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('下書きロビーはホスト以外に forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForViewing: vi
        .fn()
        .mockResolvedValue({ hostUserId: 'user-host', status: LobbyStatus.draft }),
    });

    // Act
    const result = await listLobbyGameSessions(repo, LOBBY_ID, 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('下書きロビーでもホストなら取得できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForViewing: vi
        .fn()
        .mockResolvedValue({ hostUserId: 'user-host', status: LobbyStatus.draft }),
    });

    // Act
    const result = await listLobbyGameSessions(repo, LOBBY_ID, 'user-host');

    // Assert
    expect(result.type).toBe('ok');
  });

  it('開催が0件なら空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({ findByLobbyId: vi.fn().mockResolvedValue([]) });

    // Act
    const result = await listLobbyGameSessions(repo, LOBBY_ID, null);

    // Assert
    expect(result).toEqual({ type: 'ok', gameSessions: [] });
  });

  it('絞り込みはせず、リポジトリが返した全件をそのまま返す（中止・完了も含む）', async () => {
    // Arrange
    const cancelled = {
      ...item('session-2'),
      status: GameSessionStatus.cancelled,
    };
    const repo = makeRepo({
      findByLobbyId: vi.fn().mockResolvedValue([item('session-1'), cancelled]),
    });

    // Act
    const result = await listLobbyGameSessions(repo, LOBBY_ID, null);

    // Assert
    expect(result).toEqual({
      type: 'ok',
      gameSessions: [item('session-1'), cancelled],
    });
  });
});
