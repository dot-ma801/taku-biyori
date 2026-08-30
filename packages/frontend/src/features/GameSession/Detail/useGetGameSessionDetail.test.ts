import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGetGameSessionDetail } from '@/features/GameSession/Detail/useGetGameSessionDetail';
import { GameSessionStatus } from '@taku-biyori/shared';
import type {
  LegacyGameSessionDetail,
  GameSessionMember,
} from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  getGameSession: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// composable を component 外で呼ぶため onMounted は no-op にし、
// 初期ロードはテスト側で明示的に fetch() を呼んで再現する。
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return { ...actual, onMounted: vi.fn() };
});

import { getGameSession } from '@/api/game-session';

const SESSION_ID = 'session-1';

function makeMember(id: string): GameSessionMember {
  return {
    id,
    userId: null,
    userName: null,
    guestName: 'ゲスト',
    characterName: null,
    joinedAt: '2024-01-01T00:00:00Z',
  };
}

function makeGameSession(
  overrides: Partial<LegacyGameSessionDetail> = {},
): LegacyGameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.open,
    isPublished: true,
    scheduledAt: '2026-08-01',
    createdBy: 'host-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

// gameSession を初期ロード済みの状態にした composable を返すヘルパー
async function setupLoaded(gameSession: LegacyGameSessionDetail) {
  vi.mocked(getGameSession).mockResolvedValue(gameSession);
  const detail = useGetGameSessionDetail(SESSION_ID);
  await detail.fetch();
  return detail;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetch', () => {
  it('取得したセッションを gameSession に格納する', async () => {
    // Arrange
    const gameSession = makeGameSession({ members: [makeMember('m1')] });

    // Act
    const { gameSession: state } = await setupLoaded(gameSession);

    // Assert
    expect(getGameSession).toHaveBeenCalledWith(SESSION_ID);
    expect(state.value).toEqual(gameSession);
  });
});

describe('addMember', () => {
  it('members の末尾に新メンバーを追加する', async () => {
    // Arrange
    const { gameSession, addMember } = await setupLoaded(
      makeGameSession({ members: [makeMember('m1')] }),
    );
    const newMember = makeMember('m2');

    // Act
    addMember(newMember);

    // Assert
    expect(gameSession.value?.members.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('既存メンバーを書き換えず新しい配列を生成する（不変更新）', async () => {
    // Arrange
    const { gameSession, addMember } = await setupLoaded(
      makeGameSession({ members: [makeMember('m1')] }),
    );
    const before = gameSession.value!.members;

    // Act
    addMember(makeMember('m2'));

    // Assert
    expect(gameSession.value?.members).not.toBe(before);
    expect(before.map((m) => m.id)).toEqual(['m1']);
  });

  it('gameSession 未ロード時は何もしない', () => {
    // Arrange: fetch せずに呼ぶ
    const { gameSession, addMember } = useGetGameSessionDetail(SESSION_ID);

    // Act
    addMember(makeMember('m1'));

    // Assert
    expect(gameSession.value).toBeNull();
  });
});

describe('removeMember', () => {
  it('指定 id のメンバーを削除する', async () => {
    // Arrange
    const { gameSession, removeMember } = await setupLoaded(
      makeGameSession({ members: [makeMember('m1'), makeMember('m2')] }),
    );

    // Act
    removeMember('m1');

    // Assert
    expect(gameSession.value?.members.map((m) => m.id)).toEqual(['m2']);
  });

  it('存在しない id のときはメンバーを変更しない', async () => {
    // Arrange
    const { gameSession, removeMember } = await setupLoaded(
      makeGameSession({ members: [makeMember('m1')] }),
    );

    // Act
    removeMember('not-exist');

    // Assert
    expect(gameSession.value?.members.map((m) => m.id)).toEqual(['m1']);
  });
});

describe('updateMember', () => {
  it('同じ id の既存メンバーを差し替える', async () => {
    // Arrange
    const { gameSession, updateMember } = await setupLoaded(
      makeGameSession({ members: [makeMember('m1'), makeMember('m2')] }),
    );
    const updated = { ...makeMember('m1'), characterName: '探索者A' };

    // Act
    updateMember(updated);

    // Assert
    expect(gameSession.value?.members).toEqual([updated, makeMember('m2')]);
  });

  it('一覧に無い id のときは追加せず変更しない', async () => {
    // Arrange
    const { gameSession, updateMember } = await setupLoaded(
      makeGameSession({ members: [makeMember('m1')] }),
    );

    // Act
    updateMember({ ...makeMember('ghost'), characterName: '幽霊' });

    // Assert
    expect(gameSession.value?.members.map((m) => m.id)).toEqual(['m1']);
  });
});
