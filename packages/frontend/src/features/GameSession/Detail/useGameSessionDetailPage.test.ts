import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useGameSessionDetailPage } from '@/features/GameSession/Detail/useGameSessionDetailPage';
import type { LobbyDetailModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';

/**
 * `hasPendingSchedulePoll`（確定待ちの日程調整があるか）の導出。
 *
 * **見せている開催ではなく、ロビー配下の開催すべてと突き合わせる**のが要点。
 * 表示中の開催と比べると、開催が2件以上あるロビーでホストが古いほうの URL を
 * 開いたときに「確定待ち」と誤判定し、確定済みの調整からもう1件作れてしまう。
 */

const lobbyRef = ref<LobbyDetailModel | null>(null);

// composable を component 外で呼ぶため onMounted は no-op にし、
// 開催一覧の読み込みはテストから fetchSessions を呼んで行う
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue');
  return { ...actual, onMounted: vi.fn() };
});

vi.mock('@/features/Lobby/Detail/composables/useGetLobbyDetail', () => ({
  useGetLobbyDetail: () => ({
    lobby: lobbyRef,
    loading: ref(false),
    errorMessage: ref(''),
    fetch: vi.fn(),
    patchLobby: vi.fn(),
    addEntry: vi.fn(),
    removeEntry: vi.fn(),
    activeEntryCount: ref(0),
  }),
}));
vi.mock('@/api/game-session', () => ({ listLobbyGameSessions: vi.fn() }));

const POLL_AT = new Date('2026-09-01T00:00:00.000Z');

const makeLobby = (pollCreatedAt: Date | null): LobbyDetailModel =>
  ({
    id: 'lobby-1',
    status: 'closed',
    entries: [],
    activeEntries: [],
    schedulePolls: pollCreatedAt
      ? [{ id: 'poll-1', createdAt: pollCreatedAt }]
      : [],
  }) as unknown as LobbyDetailModel;

const makeSession = (id: string, createdAt: Date): GameSessionListItemModel =>
  ({ id, createdAt }) as unknown as GameSessionListItemModel;

const setup = async (
  lobby: LobbyDetailModel,
  sessions: GameSessionListItemModel[],
) => {
  const { listLobbyGameSessions } = await import('@/api/game-session');
  vi.mocked(listLobbyGameSessions).mockResolvedValue(sessions);
  lobbyRef.value = lobby;
  const page = useGameSessionDetailPage('lobby-1');
  await page.fetchSessions();
  return page;
};

beforeEach(() => {
  vi.clearAllMocks();
  lobbyRef.value = null;
});

describe('useGameSessionDetailPage の hasPendingSchedulePoll', () => {
  // ロビーが先に揃うと画面は描画される。空配列を「開催なし」と読むと、
  // そのあいだだけ確定済みの調整を確定待ちと誤判定してしまう
  it('開催一覧を取る前は確定待ちにしない', async () => {
    // Arrange
    lobbyRef.value = makeLobby(POLL_AT);

    // Act
    const page = useGameSessionDetailPage('lobby-1');

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(false);
  });

  it('開催一覧の取得に失敗したら確定待ちにしない', async () => {
    // Arrange
    const { listLobbyGameSessions } = await import('@/api/game-session');
    vi.mocked(listLobbyGameSessions).mockRejectedValue(new Error('failed'));
    lobbyRef.value = makeLobby(POLL_AT);
    const page = useGameSessionDetailPage('lobby-1');

    // Act
    await page.fetchSessions();

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(false);
  });

  it('調整が1件も無ければ確定待ちではない', async () => {
    // Arrange / Act
    const page = await setup(makeLobby(null), []);

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(false);
  });

  it('開催がまだ無ければ確定待ち', async () => {
    // Arrange / Act
    const page = await setup(makeLobby(POLL_AT), []);

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(true);
  });

  it('調整より後に作られた開催があれば確定済み', async () => {
    // Arrange / Act
    const page = await setup(makeLobby(POLL_AT), [
      makeSession('session-1', new Date('2026-09-02T00:00:00.000Z')),
    ]);

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(false);
  });

  it('やり直した調整より後の開催がまだ無ければ確定待ち', async () => {
    // Arrange / Act
    const page = await setup(makeLobby(POLL_AT), [
      makeSession('old-session', new Date('2026-08-20T00:00:00.000Z')),
    ]);

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(true);
  });

  // 古い開催の URL を開いていても、新しい開催が1件でもあれば確定済みと分かる
  it('古い開催が残っていても新しい開催があれば確定済み', async () => {
    // Arrange / Act
    const page = await setup(makeLobby(POLL_AT), [
      makeSession('old-session', new Date('2026-08-20T00:00:00.000Z')),
      makeSession('new-session', new Date('2026-09-03T00:00:00.000Z')),
    ]);

    // Assert
    expect(page.hasPendingSchedulePoll.value).toBe(false);
  });
});
