import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useMyPlayMemo } from '@/features/GameSession/PlayMemo/useMyPlayMemo';
import { GameSessionStatus } from '@taku-biyori/shared';
import type {
  LegacyGameSessionDetail,
  GameSessionMember,
  MyGameSessionPlayMemo,
} from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  getMyPlayMemo: vi.fn(),
  updateMyPlayMemoVisibility: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { getMyPlayMemo, updateMyPlayMemoVisibility } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const SESSION_ID = 'session-1';
const HOST_USER_ID = 'user-host';
const MEMBER_USER_ID = 'user-member';
const MY_MEMBER_ID = 'member-1';

function makeMember(
  overrides: Partial<GameSessionMember> = {},
): GameSessionMember {
  return {
    id: MY_MEMBER_ID,
    userId: MEMBER_USER_ID,
    userName: 'テストユーザー',
    guestName: null,
    characterName: null,
    joinedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeGameSession(
  overrides: Partial<LegacyGameSessionDetail> = {},
): LegacyGameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.confirmed,
    isPublished: true,
    scheduledAt: '2026-08-01',
    createdBy: HOST_USER_ID,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [makeMember()],
    ...overrides,
  };
}

function makePlayMemo(
  overrides: Partial<MyGameSessionPlayMemo> = {},
): MyGameSessionPlayMemo {
  return {
    memberId: MY_MEMBER_ID,
    body: '書斎の鍵は青木さんが持っていた',
    sharedAt: null,
    updatedAt: '2026-08-03T12:04:00Z',
    ...overrides,
  };
}

// ログインユーザーを差し替える。userId が null なら未ログイン扱い
function mockCurrentUser(userId: string | null) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: userId === null ? null : { id: userId },
    isAuthenticated: userId !== null,
    ensureSessionReady: vi.fn().mockResolvedValue(undefined),
  } as unknown as ReturnType<typeof useAuthStore>);
}

function setup(
  gameSession: LegacyGameSessionDetail | null = makeGameSession(),
) {
  return useMyPlayMemo(SESSION_ID, () => gameSession);
}

/**
 * 卓詳細（マウント時にはすでに卓が届いている）と違い、メモ画面では
 * gameSession が後から届く・参加によって後から members が更新される、
 * という経路がある。`() => gameSession` の静的な渡し方では
 * useMyPlayMemo 内部の watch が発火しないため、この経路を検証するには
 * ref で渡し、テスト側で途中から値を差し替えられるようにする必要がある。
 */
function setupWithGameSessionRef(
  initial: LegacyGameSessionDetail | null = null,
) {
  const gameSession = ref<LegacyGameSessionDetail | null>(initial);
  return { ...useMyPlayMemo(SESSION_ID, gameSession), gameSession };
}

/**
 * 生成時の自動取得を完了させ、API モックの呼び出し履歴を消した状態で返す。
 * fetch を明示的に呼ぶテストが、自動取得の分と混ざらないようにするためのヘルパー。
 */
async function setupSettled(
  gameSession: LegacyGameSessionDetail | null = makeGameSession(),
) {
  const result = setup(gameSession);
  await flushPromises();
  vi.mocked(getMyPlayMemo).mockClear();
  return result;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  mockCurrentUser(MEMBER_USER_ID);
  vi.mocked(getMyPlayMemo).mockResolvedValue(makePlayMemo());
});

describe('isMyMemo', () => {
  it('ログインユーザーのメンバー行があれば true', () => {
    // Arrange & Act
    const { isMyMemo } = setup();

    // Assert
    expect(isMyMemo.value).toBe(true);
  });

  it('ログインしていなければ false', () => {
    // Arrange
    mockCurrentUser(null);

    // Act
    const { isMyMemo } = setup();

    // Assert
    expect(isMyMemo.value).toBe(false);
  });

  it('ゲストしかいない卓では false（ゲストは userId = null で引き当てられない）', () => {
    // Arrange
    const gameSession = makeGameSession({
      members: [
        makeMember({ userId: null, userName: null, guestName: 'ゲスト' }),
      ],
    });

    // Act
    const { isMyMemo } = setup(gameSession);

    // Assert
    expect(isMyMemo.value).toBe(false);
  });

  it('ログイン済みでもメンバーでなければ false', () => {
    // Arrange
    mockCurrentUser('user-stranger');

    // Act
    const { isMyMemo } = setup();

    // Assert
    expect(isMyMemo.value).toBe(false);
  });

  it('卓がまだ読み込まれていなければ false', () => {
    // Arrange & Act
    const { isMyMemo } = setup(null);

    // Assert
    expect(isMyMemo.value).toBe(false);
  });
});

describe('showLoginPrompt', () => {
  it('未ログインなら true', () => {
    // Arrange
    mockCurrentUser(null);

    // Act
    const { showLoginPrompt } = setup();

    // Assert
    expect(showLoginPrompt.value).toBe(true);
  });

  it('ログイン済みなら（非メンバーでも）false', () => {
    // Arrange
    mockCurrentUser('user-stranger');

    // Act
    const { showLoginPrompt } = setup();

    // Assert
    expect(showLoginPrompt.value).toBe(false);
  });
});

describe('canEditBody', () => {
  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.confirmed,
    GameSessionStatus.today,
  ])('メンバーかつ %s ステータスのとき true', (status) => {
    // Arrange & Act
    const { canEditBody } = setup(makeGameSession({ status }));

    // Assert
    expect(canEditBody.value).toBe(true);
  });

  it.each([GameSessionStatus.completed, GameSessionStatus.cancelled])(
    '%s ステータスでは false（本文編集は閉じる）',
    (status) => {
      // Arrange & Act
      const { canEditBody } = setup(makeGameSession({ status }));

      // Assert
      expect(canEditBody.value).toBe(false);
    },
  );

  it('ホストもプレイヤーとして自分のメモを編集できる', () => {
    // Arrange
    mockCurrentUser(HOST_USER_ID);
    const gameSession = makeGameSession({
      members: [makeMember({ userId: HOST_USER_ID })],
    });

    // Act
    const { canEditBody } = setup(gameSession);

    // Assert
    expect(canEditBody.value).toBe(true);
  });

  it('メンバーでなければ false', () => {
    // Arrange
    mockCurrentUser('user-stranger');

    // Act
    const { canEditBody } = setup();

    // Assert
    expect(canEditBody.value).toBe(false);
  });

  it('卓がまだ読み込まれていなければ false', () => {
    // Arrange & Act
    const { canEditBody } = setup(null);

    // Assert
    expect(canEditBody.value).toBe(false);
  });
});

describe('自動取得', () => {
  it('卓が読み込まれていれば生成時に取得する', async () => {
    // Arrange
    const playMemo = makePlayMemo();
    vi.mocked(getMyPlayMemo).mockResolvedValue(playMemo);

    // Act
    const { playMemo: state } = setup();
    await flushPromises();

    // Assert
    expect(getMyPlayMemo).toHaveBeenCalledWith(SESSION_ID);
    expect(state.value).toEqual(playMemo);
  });

  it('卓がまだ読み込まれていなければ取得しない', async () => {
    // Arrange & Act
    setup(null);
    await flushPromises();

    // Assert
    expect(getMyPlayMemo).not.toHaveBeenCalled();
  });

  it('卓が後から届いても、その時点でメンバーなら取得する（メモ画面の経路）', async () => {
    // Arrange
    const { gameSession, playMemo } = setupWithGameSessionRef(null);
    await flushPromises();
    expect(getMyPlayMemo).not.toHaveBeenCalled();

    // Act
    gameSession.value = makeGameSession();
    await flushPromises();

    // Assert
    expect(getMyPlayMemo).toHaveBeenCalledWith(SESSION_ID);
    expect(playMemo.value).not.toBeNull();
  });

  it('メンバーのまま卓が2回差し替わっても、取得は1回で済む', async () => {
    // Arrange
    const { gameSession } = setupWithGameSessionRef(makeGameSession());
    await flushPromises();
    vi.mocked(getMyPlayMemo).mockClear();

    // Act: 本文とは無関係な差し替え（isMyMemo は true のまま変化しない）
    gameSession.value = makeGameSession({ status: GameSessionStatus.today });
    await flushPromises();
    gameSession.value = makeGameSession({
      status: GameSessionStatus.confirmed,
    });
    await flushPromises();

    // Assert: watch(isMyMemo) は値が実際に変化したときだけ発火するため、
    // true のままの再代入では再取得が起きない
    expect(getMyPlayMemo).not.toHaveBeenCalled();
  });

  it('参加して members に自分が加わったら取得する', async () => {
    // Arrange: 自分がまだメンバーに含まれていない卓
    const strangerSession = makeGameSession({ members: [] });
    const { gameSession, playMemo } = setupWithGameSessionRef(strangerSession);
    await flushPromises();
    expect(getMyPlayMemo).not.toHaveBeenCalled();
    expect(playMemo.value).toBeNull();

    // Act: 参加して members に自分が加わる
    gameSession.value = makeGameSession({ members: [makeMember()] });
    await flushPromises();

    // Assert
    expect(getMyPlayMemo).toHaveBeenCalledWith(SESSION_ID);
  });
});

describe('fetch', () => {
  it('メンバーなら API を呼び、取得したメモを保持する', async () => {
    // Arrange
    const playMemo = makePlayMemo({ body: '書き直した本文' });
    const { playMemo: state, fetch } = await setupSettled();
    vi.mocked(getMyPlayMemo).mockResolvedValue(playMemo);

    // Act
    await fetch();

    // Assert
    expect(getMyPlayMemo).toHaveBeenCalledWith(SESSION_ID);
    expect(state.value).toEqual(playMemo);
  });

  it('未ログインなら API を呼ばない', async () => {
    // Arrange
    mockCurrentUser(null);
    const { playMemo, fetch } = await setupSettled();

    // Act
    await fetch();

    // Assert
    expect(getMyPlayMemo).not.toHaveBeenCalled();
    expect(playMemo.value).toBeNull();
  });

  it('ログイン済みでもメンバーでなければ API を呼ばない（403 を出し続けない）', async () => {
    // Arrange
    mockCurrentUser('user-stranger');
    const { fetch } = await setupSettled();

    // Act
    await fetch();

    // Assert
    expect(getMyPlayMemo).not.toHaveBeenCalled();
  });

  it('判定の前にセッション復元の完了を待つ', async () => {
    // Arrange
    const ensureSessionReady = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuthStore).mockReturnValue({
      currentUser: { id: MEMBER_USER_ID },
      isAuthenticated: true,
      ensureSessionReady,
    } as unknown as ReturnType<typeof useAuthStore>);
    const { fetch } = await setupSettled();
    ensureSessionReady.mockClear();

    // Act
    await fetch();

    // Assert
    expect(ensureSessionReady).toHaveBeenCalled();
  });

  it('メモが未作成でも空メモを保持する（未作成の分岐を持たない）', async () => {
    // Arrange
    const emptyMemo = makePlayMemo({ body: '', updatedAt: null });
    const { playMemo, fetch } = await setupSettled();
    vi.mocked(getMyPlayMemo).mockResolvedValue(emptyMemo);

    // Act
    await fetch();

    // Assert
    expect(playMemo.value).toEqual(emptyMemo);
  });

  it('API が失敗したら playMemo を null に戻す（セクションを閉じる）', async () => {
    // Arrange
    const { playMemo, fetch } = await setupSettled();
    vi.mocked(getMyPlayMemo).mockRejectedValue(new Error('API error'));

    // Act
    await fetch();

    // Assert
    expect(playMemo.value).toBeNull();
  });

  it('取得中は loading が true になる（通信開始前・ensureSessionReady 待ちの間も true）', async () => {
    // Arrange
    const { loading, fetch } = await setupSettled();
    let resolveFetch!: () => void;
    vi.mocked(getMyPlayMemo).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = () => resolve(makePlayMemo());
      }),
    );

    // Act
    const promise = fetch();
    // await を挟まず、fetch() 呼び出し直後（ensureSessionReady の解決前）から true
    expect(loading.value).toBe(true);

    resolveFetch();
    await promise;

    // Assert
    expect(loading.value).toBe(false);
  });
});

describe('applySaved', () => {
  it('保存後のサーバ値で playMemo を差し替える', async () => {
    // Arrange
    const { playMemo, applySaved } = await setupSettled();
    const saved = makePlayMemo({ body: '書き足した本文' });

    // Act
    applySaved(saved);

    // Assert
    expect(playMemo.value).toEqual(saved);
  });
});

describe('isShared', () => {
  it('sharedAt があれば true', async () => {
    // Arrange
    vi.mocked(getMyPlayMemo).mockResolvedValue(
      makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' }),
    );

    // Act
    const { isShared } = await setupSettled();

    // Assert
    expect(isShared.value).toBe(true);
  });

  it('sharedAt が null なら false（既定は非公開）', async () => {
    // Arrange & Act
    const { isShared } = await setupSettled();

    // Assert
    expect(isShared.value).toBe(false);
  });
});

describe('canToggleVisibility', () => {
  it.each([GameSessionStatus.completed, GameSessionStatus.cancelled])(
    '%s で本文が編集できなくなっても、保存済みメモなら切り替えられる',
    async (status) => {
      // Arrange & Act
      const { canToggleVisibility, canEditBody } = await setupSettled(
        makeGameSession({ status }),
      );

      // Assert
      expect(canEditBody.value).toBe(false);
      expect(canToggleVisibility.value).toBe(true);
    },
  );

  it('メモが未作成（updatedAt が null）なら false（API が 404 を返すため）', async () => {
    // Arrange
    vi.mocked(getMyPlayMemo).mockResolvedValue(
      makePlayMemo({ body: '', updatedAt: null }),
    );

    // Act
    const { canToggleVisibility } = await setupSettled();

    // Assert
    expect(canToggleVisibility.value).toBe(false);
  });

  it('メモを取得できていなければ false', async () => {
    // Arrange
    mockCurrentUser('user-stranger');

    // Act
    const { canToggleVisibility } = await setupSettled();

    // Assert
    expect(canToggleVisibility.value).toBe(false);
  });
});

describe('setShared', () => {
  it('公開に切り替えると API を呼び、サーバ値で playMemo を差し替える', async () => {
    // Arrange
    const shared = makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' });
    vi.mocked(updateMyPlayMemoVisibility).mockResolvedValue(shared);
    const { playMemo, isShared, setShared } = await setupSettled();

    // Act
    await setShared(true);

    // Assert
    expect(updateMyPlayMemoVisibility).toHaveBeenCalledWith(SESSION_ID, {
      shared: true,
    });
    expect(playMemo.value).toEqual(shared);
    expect(isShared.value).toBe(true);
  });

  it('非公開に戻せる', async () => {
    // Arrange
    vi.mocked(getMyPlayMemo).mockResolvedValue(
      makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' }),
    );
    vi.mocked(updateMyPlayMemoVisibility).mockResolvedValue(makePlayMemo());
    const { isShared, setShared } = await setupSettled();
    expect(isShared.value).toBe(true);

    // Act
    await setShared(false);

    // Assert
    expect(updateMyPlayMemoVisibility).toHaveBeenCalledWith(SESSION_ID, {
      shared: false,
    });
    expect(isShared.value).toBe(false);
  });

  it('完了した卓でも切り替えられる（本文編集と独立）', async () => {
    // Arrange
    const shared = makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' });
    vi.mocked(updateMyPlayMemoVisibility).mockResolvedValue(shared);
    const { setShared } = await setupSettled(
      makeGameSession({ status: GameSessionStatus.completed }),
    );

    // Act
    await setShared(true);

    // Assert
    expect(updateMyPlayMemoVisibility).toHaveBeenCalledWith(SESSION_ID, {
      shared: true,
    });
  });

  it('メモが未作成なら API を呼ばない（404 を出さない）', async () => {
    // Arrange
    vi.mocked(getMyPlayMemo).mockResolvedValue(
      makePlayMemo({ body: '', updatedAt: null }),
    );
    const { setShared } = await setupSettled();

    // Act
    await setShared(true);

    // Assert
    expect(updateMyPlayMemoVisibility).not.toHaveBeenCalled();
  });

  it('失敗したら visibilityStatus を failed にし、公開状態は変えない', async () => {
    // Arrange
    vi.mocked(updateMyPlayMemoVisibility).mockRejectedValue(
      new Error('API error'),
    );
    const { isShared, visibilityStatus, setShared } = await setupSettled();

    // Act
    await setShared(true);

    // Assert
    expect(visibilityStatus.value).toBe('failed');
    expect(isShared.value).toBe(false);
  });

  it('実際に PATCH を送ったときは true を返す', async () => {
    // Arrange
    vi.mocked(updateMyPlayMemoVisibility).mockResolvedValue(
      makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' }),
    );
    const { setShared } = await setupSettled();

    // Act
    const sent = await setShared(true);

    // Assert
    expect(sent).toBe(true);
  });

  it('切替不可（メモ未作成）で早期 return したときは false を返す（送っていない）', async () => {
    // Arrange
    vi.mocked(getMyPlayMemo).mockResolvedValue(
      makePlayMemo({ body: '', updatedAt: null }),
    );
    const { setShared } = await setupSettled();

    // Act
    const sent = await setShared(true);

    // Assert
    expect(sent).toBe(false);
    expect(updateMyPlayMemoVisibility).not.toHaveBeenCalled();
  });

  it('送信中の二重呼び出しで早期 return したときは false を返す（送っていない）', async () => {
    // Arrange
    const { setShared } = await setupSettled();
    let resolveUpdate!: () => void;
    vi.mocked(updateMyPlayMemoVisibility).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = () =>
          resolve(makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' }));
      }),
    );

    // Act
    const first = setShared(true);
    const second = setShared(true);
    resolveUpdate();
    const [firstSent, secondSent] = await Promise.all([first, second]);

    // Assert
    expect(firstSent).toBe(true);
    expect(secondSent).toBe(false);
  });

  it('失敗しても実際に送ってはいるので true を返す', async () => {
    // Arrange
    vi.mocked(updateMyPlayMemoVisibility).mockRejectedValue(
      new Error('API error'),
    );
    const { setShared } = await setupSettled();

    // Act
    const sent = await setShared(true);

    // Assert
    expect(sent).toBe(true);
  });

  it('送信中は visibilityStatus が saving になり、二重送信しない', async () => {
    // Arrange
    const { visibilityStatus, setShared } = await setupSettled();
    let resolveUpdate!: () => void;
    vi.mocked(updateMyPlayMemoVisibility).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = () =>
          resolve(makePlayMemo({ sharedAt: '2026-08-04T09:00:00Z' }));
      }),
    );

    // Act
    const first = setShared(true);
    expect(visibilityStatus.value).toBe('saving');
    const second = setShared(true);
    resolveUpdate();
    await Promise.all([first, second]);

    // Assert
    expect(updateMyPlayMemoVisibility).toHaveBeenCalledTimes(1);
    expect(visibilityStatus.value).toBe('idle');
  });
});
