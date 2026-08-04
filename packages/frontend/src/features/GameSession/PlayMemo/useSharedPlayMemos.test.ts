import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { useSharedPlayMemos } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';
import { GameSessionStatus } from '@taku-biyori/shared';
import type {
  GameSessionDetail,
  GameSessionMember,
  SharedGameSessionPlayMemo,
} from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  listSharedPlayMemos: vi.fn(),
}));

import { listSharedPlayMemos } from '@/api/game-session';

const SESSION_ID = 'session-1';
const HOST_USER_ID = 'user-host';

const MY_MEMBER_ID = 'member-me';
const OTHER_MEMBER_ID = 'member-other';
const PRIVATE_MEMBER_ID = 'member-private';
const GUEST_MEMBER_ID = 'member-guest';

function makeMember(
  id: string,
  overrides: Partial<GameSessionMember> = {},
): GameSessionMember {
  return {
    id,
    userId: `user-${id}`,
    userName: `ユーザー${id}`,
    guestName: null,
    characterName: null,
    joinedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** 自分・公開している他メンバー・非公開の他メンバー・ゲストの4人が居る卓 */
function makeGameSession(
  overrides: Partial<GameSessionDetail> = {},
): GameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.completed,
    isPublished: true,
    scheduledAt: '2026-08-01',
    createdBy: HOST_USER_ID,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    members: [
      makeMember(MY_MEMBER_ID, { userName: '自分', characterName: '探偵' }),
      makeMember(OTHER_MEMBER_ID, {
        userName: '青木',
        characterName: '執事',
      }),
      makeMember(PRIVATE_MEMBER_ID, { userName: '佐藤' }),
      makeMember(GUEST_MEMBER_ID, {
        userId: null,
        userName: null,
        guestName: '通りすがり',
      }),
    ],
    ...overrides,
  };
}

function makeSharedMemo(
  memberId: string,
  overrides: Partial<SharedGameSessionPlayMemo> = {},
): SharedGameSessionPlayMemo {
  return {
    memberId,
    body: '書斎の鍵は青木さんが持っていた',
    sharedAt: '2026-08-04T09:00:00Z',
    updatedAt: '2026-08-03T12:04:00Z',
    ...overrides,
  };
}

function setup(
  gameSession: GameSessionDetail | null = makeGameSession(),
  myMemberId: string | null = MY_MEMBER_ID,
) {
  return useSharedPlayMemos(
    SESSION_ID,
    () => gameSession,
    () => myMemberId,
  );
}

/** ステータスの変化（完了・中止への遷移）を再現するため ref で渡す */
function setupWithGameSessionRef(initial: GameSessionDetail | null = null) {
  const gameSession = ref<GameSessionDetail | null>(initial);
  return {
    ...useSharedPlayMemos(SESSION_ID, gameSession, () => MY_MEMBER_ID),
    gameSession,
  };
}

function findEntry(
  entries: ReturnType<typeof setup>['entries'],
  memberId: string,
) {
  return entries.value.find((entry) => entry.memberId === memberId);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listSharedPlayMemos).mockResolvedValue([
    makeSharedMemo(OTHER_MEMBER_ID),
    makeSharedMemo(MY_MEMBER_ID, { body: '自分のメモ' }),
  ]);
});

describe('canViewShared', () => {
  it.each([GameSessionStatus.completed, GameSessionStatus.cancelled])(
    '%s なら true',
    (status) => {
      // Arrange & Act
      const { canViewShared } = setup(makeGameSession({ status }));

      // Assert
      expect(canViewShared.value).toBe(true);
    },
  );

  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.confirmed,
    GameSessionStatus.today,
  ])('%s なら false（他メンバーのメモは読めない）', (status) => {
    // Arrange & Act
    const { canViewShared } = setup(makeGameSession({ status }));

    // Assert
    expect(canViewShared.value).toBe(false);
  });

  it('卓がまだ読み込まれていなければ false', () => {
    // Arrange & Act
    const { canViewShared } = setup(null);

    // Assert
    expect(canViewShared.value).toBe(false);
  });
});

describe('自動取得', () => {
  it('完了した卓なら生成時に取得する', async () => {
    // Arrange & Act
    setup();
    await flushPromises();

    // Assert
    expect(listSharedPlayMemos).toHaveBeenCalledWith(SESSION_ID);
  });

  it.each([
    GameSessionStatus.draft,
    GameSessionStatus.confirmed,
    GameSessionStatus.today,
  ])('%s では取得しない（1件も返らない時期に通信しない）', async (status) => {
    // Arrange & Act
    setup(makeGameSession({ status }));
    await flushPromises();

    // Assert
    expect(listSharedPlayMemos).not.toHaveBeenCalled();
  });

  it('卓が後から届いても、完了していれば取得する', async () => {
    // Arrange
    const { gameSession } = setupWithGameSessionRef(null);
    await flushPromises();
    expect(listSharedPlayMemos).not.toHaveBeenCalled();

    // Act
    gameSession.value = makeGameSession();
    await flushPromises();

    // Assert
    expect(listSharedPlayMemos).toHaveBeenCalledWith(SESSION_ID);
  });

  it('取得に失敗したら空のまま（非公開卓の 403 でも画面を壊さない）', async () => {
    // Arrange
    vi.mocked(listSharedPlayMemos).mockRejectedValue(new Error('Forbidden'));

    // Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(entries.value.every((entry) => entry.sharedPlayMemo === null)).toBe(
      true,
    );
  });

  it('取得中は loading が true になる', async () => {
    // Arrange
    let resolveFetch!: () => void;
    vi.mocked(listSharedPlayMemos).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = () => resolve([]);
      }),
    );

    // Act
    const { loading } = setup();
    expect(loading.value).toBe(true);
    resolveFetch();
    await flushPromises();

    // Assert
    expect(loading.value).toBe(false);
  });
});

describe('entries', () => {
  it('参加メンバー全員が卓の並び順で並ぶ', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(entries.value.map((entry) => entry.memberId)).toEqual([
      MY_MEMBER_ID,
      OTHER_MEMBER_ID,
      PRIVATE_MEMBER_ID,
      GUEST_MEMBER_ID,
    ]);
  });

  it('公開している他メンバーは読めて、公開メモを持つ', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    const entry = findEntry(entries, OTHER_MEMBER_ID);
    expect(entry).toMatchObject({
      tag: 'shared',
      readable: true,
      isMe: false,
    });
    expect(entry?.sharedPlayMemo?.body).toBe('書斎の鍵は青木さんが持っていた');
  });

  it('非公開の他メンバーは読めない', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, PRIVATE_MEMBER_ID)).toMatchObject({
      tag: 'private',
      readable: false,
      sharedPlayMemo: null,
    });
  });

  it('ゲストは読めず、タグで理由を示す', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, GUEST_MEMBER_ID)).toMatchObject({
      tag: 'guest',
      readable: false,
    });
  });

  it('自分は非公開でも読める（本人はいつでも読める）', async () => {
    // Arrange: 自分の公開メモは返さない
    vi.mocked(listSharedPlayMemos).mockResolvedValue([
      makeSharedMemo(OTHER_MEMBER_ID),
    ]);

    // Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, MY_MEMBER_ID)).toMatchObject({
      tag: 'private',
      readable: true,
      isMe: true,
    });
  });

  it('自分が公開していれば公開タグになる', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, MY_MEMBER_ID)).toMatchObject({
      tag: 'shared',
      isMe: true,
    });
  });

  it('キャラ名を主ラベル・ユーザー名を副ラベルにする', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, OTHER_MEMBER_ID)).toMatchObject({
      primaryLabel: '執事',
      secondaryLabel: '青木',
    });
  });

  it('キャラ名が無ければユーザー名を主ラベルへ繰り上げる', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, PRIVATE_MEMBER_ID)).toMatchObject({
      primaryLabel: '佐藤',
      secondaryLabel: null,
    });
  });

  it('ゲストの名前に「（ゲスト）」を付けない（タグと重複するため）', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, GUEST_MEMBER_ID)?.primaryLabel).toBe(
      '通りすがり',
    );
  });

  it('アバターの種はユーザー ID、ゲストは null で名前にフォールバックする', async () => {
    // Arrange & Act
    const { entries } = setup();
    await flushPromises();

    // Assert
    expect(findEntry(entries, OTHER_MEMBER_ID)).toMatchObject({
      userId: `user-${OTHER_MEMBER_ID}`,
      avatarName: '青木',
    });
    expect(findEntry(entries, GUEST_MEMBER_ID)).toMatchObject({
      userId: null,
      avatarName: '通りすがり',
    });
  });

  it('卓がまだ読み込まれていなければ空', () => {
    // Arrange & Act
    const { entries } = setup(null);

    // Assert
    expect(entries.value).toEqual([]);
  });

  it('メンバーでない閲覧者には isMe の行が無い', async () => {
    // Arrange & Act
    const { entries } = setup(makeGameSession(), null);
    await flushPromises();

    // Assert
    expect(entries.value.some((entry) => entry.isMe)).toBe(false);
  });
});

describe('公開件数', () => {
  it('othersSharedCount は自分の公開メモを除いて数える', async () => {
    // Arrange & Act
    const { othersSharedCount } = setup();
    await flushPromises();

    // Assert
    expect(othersSharedCount.value).toBe(1);
  });

  it('自分しか公開していなければ othersSharedCount は 0', async () => {
    // Arrange
    vi.mocked(listSharedPlayMemos).mockResolvedValue([
      makeSharedMemo(MY_MEMBER_ID),
    ]);

    // Act
    const { othersSharedCount } = setup();
    await flushPromises();

    // Assert
    expect(othersSharedCount.value).toBe(0);
  });

  it('1件も公開されていなければ othersSharedCount は 0', async () => {
    // Arrange
    vi.mocked(listSharedPlayMemos).mockResolvedValue([]);

    // Act
    const { othersSharedCount } = setup();
    await flushPromises();

    // Assert
    expect(othersSharedCount.value).toBe(0);
  });
});

describe('fetch', () => {
  it('公開切替のあとに呼び直すと一覧が最新になる', async () => {
    // Arrange
    vi.mocked(listSharedPlayMemos).mockResolvedValue([]);
    const { entries, fetch } = setup();
    await flushPromises();
    vi.mocked(listSharedPlayMemos).mockResolvedValue([
      makeSharedMemo(MY_MEMBER_ID),
    ]);

    // Act
    await fetch();

    // Assert
    expect(findEntry(entries, MY_MEMBER_ID)?.tag).toBe('shared');
  });

  it('読めないステータスでは呼んでも通信しない', async () => {
    // Arrange
    const { fetch } = setup(
      makeGameSession({ status: GameSessionStatus.confirmed }),
    );
    await flushPromises();

    // Act
    await fetch();

    // Assert
    expect(listSharedPlayMemos).not.toHaveBeenCalled();
  });
});
