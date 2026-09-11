import { describe, expect, it, vi } from 'vitest';
import { createGameSession } from '@/game-session/application/create-game-session';
import type { CreateGameSessionRepository } from '@/game-session/application/create-game-session';
import type { CreateGameSessionInput, GameSession } from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';

/** 実行日に依存させないため、開催日の検証に渡す「今日」を固定する */
const TODAY = '2026-08-02';
const LOBBY_ID = 'lobby-1';
const HOST = 'user-host';
const ENTRY_A = 'entry-a';
const ENTRY_B = 'entry-b';

const created: GameSession = {
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
    scenarioName: null,
    location: null,
    maxPlayers: 6,
    hostUserId: HOST,
    status: LobbyStatus.open,
  },
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const input: CreateGameSessionInput = {
  scheduledAt: '2026-09-01',
  entryIds: [ENTRY_A, ENTRY_B],
};

const makeRepo = (
  overrides: Partial<CreateGameSessionRepository> = {},
): CreateGameSessionRepository => {
  const repo: CreateGameSessionRepository = {
    findLobbyForHost: vi
      .fn()
      .mockResolvedValue({ hostUserId: HOST, status: LobbyStatus.open }),
    findActiveEntryIds: vi.fn().mockResolvedValue([ENTRY_A, ENTRY_B]),
    createGameSession: vi.fn().mockResolvedValue(created),
    // ロック内で使うリポジトリは自分自身を渡す（実装では別トランザクション版になる）
    executeWithLobbyLock: vi.fn(async (_lobbyId, _entryIds, fn) => fn(repo)),
    ...overrides,
  };
  return repo;
};

describe('createGameSession', () => {
  it('ホストが着席者を選んで開催を作れる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: created });
  });

  it('ロビーが無ければ notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForHost: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createGameSession(
      repo,
      LOBBY_ID,
      'user-2',
      input,
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
    expect(repo.createGameSession).not.toHaveBeenCalled();
  });

  it('解散したロビーには開催を作れない', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForHost: vi
        .fn()
        .mockResolvedValue({ hostUserId: HOST, status: LobbyStatus.disbanded }),
    });

    // Act
    const result = await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('過去日には開催を作れない', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await createGameSession(
      repo,
      LOBBY_ID,
      HOST,
      {
        ...input,
        scheduledAt: '2000-01-01',
      },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'pastScheduledAt' });
    expect(repo.createGameSession).not.toHaveBeenCalled();
  });

  it('受付を閉じたロビーにも開催を作れる（受付と開催は独立）', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForHost: vi
        .fn()
        .mockResolvedValue({ hostUserId: HOST, status: LobbyStatus.closed }),
    });

    // Act
    const result = await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(result.type).toBe('ok');
  });

  it('下書きのロビーにも開催を作れる（直接卓立ての経路）', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyForHost: vi
        .fn()
        .mockResolvedValue({ hostUserId: HOST, status: LobbyStatus.draft }),
    });

    // Act
    const result = await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(result.type).toBe('ok');
  });

  it('別のロビーの entryId が混ざっていたら invalidEntries を返す', async () => {
    // Arrange
    // このロビーに在籍している entry しか返らない
    const repo = makeRepo({
      findActiveEntryIds: vi.fn().mockResolvedValue([ENTRY_A]),
    });

    // Act
    const result = await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(result).toEqual({ type: 'invalidEntries' });
    expect(repo.createGameSession).not.toHaveBeenCalled();
  });

  it('脱退済みの entryId を着席させようとしたら invalidEntries を返す', async () => {
    // Arrange
    // findActiveEntryIds は left_at IS NULL で絞るので、脱退済みは返ってこない
    const repo = makeRepo({
      findActiveEntryIds: vi.fn().mockResolvedValue([ENTRY_A]),
    });

    // Act
    const result = await createGameSession(
      repo,
      LOBBY_ID,
      HOST,
      {
        ...input,
        entryIds: [ENTRY_A, ENTRY_B],
      },
      TODAY,
    );

    // Assert
    expect(result).toEqual({ type: 'invalidEntries' });
  });

  it('同じ entryId を重複して渡しても1件として扱う', async () => {
    // Arrange
    const repo = makeRepo({
      findActiveEntryIds: vi.fn().mockResolvedValue([ENTRY_A]),
    });

    // Act
    const result = await createGameSession(
      repo,
      LOBBY_ID,
      HOST,
      {
        ...input,
        entryIds: [ENTRY_A, ENTRY_A],
      },
      TODAY,
    );

    // Assert
    expect(result.type).toBe('ok');
    expect(repo.createGameSession).toHaveBeenCalledWith(
      expect.objectContaining({ entryIds: [ENTRY_A] }),
    );
  });

  it('検証と INSERT をロックの内側で実行する', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    // ロビーを FOR UPDATE、entry を FOR KEY SHARE で押さえる（design-v2 §5-2）
    expect(repo.executeWithLobbyLock).toHaveBeenCalledWith(
      LOBBY_ID,
      [ENTRY_A, ENTRY_B],
      expect.any(Function),
    );
  });

  it('上書き項目と当日の連絡事項をそのまま渡す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    await createGameSession(
      repo,
      LOBBY_ID,
      HOST,
      {
        ...input,
        title: '第2回',
        location: 'カフェ〇〇',
        timeLabel: '13:00〜',
        description: '13:50 に VC 集合',
      },
      TODAY,
    );

    // Assert
    expect(repo.createGameSession).toHaveBeenCalledWith({
      lobbyId: LOBBY_ID,
      scheduledAt: '2026-09-01',
      entryIds: [ENTRY_A, ENTRY_B],
      title: '第2回',
      scenarioName: undefined,
      location: 'カフェ〇〇',
      timeLabel: '13:00〜',
      description: '13:50 に VC 集合',
    });
  });

  it('渡されなかった上書き項目は既定値をコピーせず undefined のままにする', async () => {
    // Arrange
    // 既定値を DB に書き込むと、以後ロビーを改名しても追随しなくなる（design-v2 §5-5）
    const repo = makeRepo();

    // Act
    await createGameSession(repo, LOBBY_ID, HOST, input, TODAY);

    // Assert
    expect(repo.createGameSession).toHaveBeenCalledWith(
      expect.objectContaining({
        title: undefined,
        scenarioName: undefined,
        location: undefined,
        timeLabel: undefined,
      }),
    );
  });
});
