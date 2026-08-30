import { describe, expect, it, vi } from 'vitest';
import { getGameSession } from '@/game-session/application/get-game-session';
import type { GetGameSessionRepository } from '@/game-session/application/get-game-session';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';

const LOBBY_ID = 'lobby-1';

const detail = (
  overrides: Partial<GameSessionDetail> = {},
  lobby: Partial<GameSessionDetail['lobby']> = {},
): GameSessionDetail => ({
  id: 'session-1',
  lobbyId: LOBBY_ID,
  scheduledAt: '2026-09-01',
  status: GameSessionStatus.scheduled,
  description: null,
  overrides: {
    title: null,
    scenarioName: null,
    location: null,
    timeLabel: null,
  },
  lobby: {
    id: LOBBY_ID,
    title: 'マダミス「蒼き月」',
    scenarioName: '蒼き月の夜',
    location: 'オンライン',
    maxPlayers: 6,
    hostUserId: 'user-host',
    status: LobbyStatus.open,
    ...lobby,
  },
  completedAt: null,
  cancelledAt: null,
  seats: [],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
});

const repoWith = (
  value: GameSessionDetail | null,
): GetGameSessionRepository => ({
  findDetailById: vi.fn().mockResolvedValue(value),
});

describe('getGameSession', () => {
  it('公開ロビーの開催は未ログインでも取得できる', async () => {
    // Arrange
    const gameSession = detail();
    const repo = repoWith(gameSession);

    // Act
    const result = await getGameSession(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession });
  });

  it('存在しなければ notFound を返す', async () => {
    // Arrange
    const repo = repoWith(null);

    // Act
    const result = await getGameSession(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('URL の lobbyId がセッションの所属ロビーと違えば notFound を返す', async () => {
    // Arrange
    // 入れ子パスにしたことで、他人のロビー ID を被せて覗く経路が生まれる（design-v2 §6-5）
    const repo = repoWith(detail());

    // Act
    const result = await getGameSession(repo, 'lobby-other', 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('下書きロビーの開催はホストなら取得できる', async () => {
    // Arrange
    const gameSession = detail({}, { status: LobbyStatus.draft });
    const repo = repoWith(gameSession);

    // Act
    const result = await getGameSession(
      repo,
      LOBBY_ID,
      'session-1',
      'user-host',
    );

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession });
  });

  it('下書きロビーの開催はホスト以外だと forbidden を返す', async () => {
    // Arrange
    const repo = repoWith(detail({}, { status: LobbyStatus.draft }));

    // Act
    const result = await getGameSession(repo, LOBBY_ID, 'session-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('下書きロビーの開催は未ログインだと forbidden を返す', async () => {
    // Arrange
    const repo = repoWith(detail({}, { status: LobbyStatus.draft }));

    // Act
    const result = await getGameSession(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('解散したロビーでも公開済みなら取得できる（過去の開催は記録として残る）', async () => {
    // Arrange
    const gameSession = detail({}, { status: LobbyStatus.disbanded });
    const repo = repoWith(gameSession);

    // Act
    const result = await getGameSession(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession });
  });

  it('解決済みの表示値は返さず、上書きの生値とロビーをそのまま返す', async () => {
    // Arrange
    const gameSession = detail({
      overrides: {
        title: null,
        scenarioName: null,
        location: 'カフェ〇〇',
        timeLabel: null,
      },
    });
    const repo = repoWith(gameSession);

    // Act
    const result = await getGameSession(repo, LOBBY_ID, 'session-1', null);

    // Assert
    expect(result.type).toBe('ok');
    if (result.type !== 'ok') return;
    expect(result.gameSession.overrides.title).toBeNull();
    expect(result.gameSession.overrides.location).toBe('カフェ〇〇');
    expect(result.gameSession.lobby.title).toBe('マダミス「蒼き月」');
    expect('title' in result.gameSession).toBe(false);
  });
});
