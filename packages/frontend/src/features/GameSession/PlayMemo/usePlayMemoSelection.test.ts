import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';
import { usePlayMemoSelection } from '@/features/GameSession/PlayMemo/usePlayMemoSelection';
import type { PlayMemoMemberEntry } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}));

import { useRoute, useRouter } from 'vue-router';

const MY_MEMBER_ID = 'member-me';
const SHARED_MEMBER_ID = 'member-shared';
const PRIVATE_MEMBER_ID = 'member-private';

function makeEntry(
  memberId: string,
  overrides: Partial<PlayMemoMemberEntry> = {},
): PlayMemoMemberEntry {
  return {
    memberId,
    primaryLabel: memberId,
    secondaryLabel: null,
    tag: 'shared',
    selectable: true,
    isMe: false,
    sharedPlayMemo: null,
    ...overrides,
  };
}

/** 自分・公開している他メンバー・非公開の他メンバーが並ぶサイドバー */
function makeEntries(): PlayMemoMemberEntry[] {
  return [
    makeEntry(SHARED_MEMBER_ID),
    makeEntry(MY_MEMBER_ID, { isMe: true, tag: 'private' }),
    makeEntry(PRIVATE_MEMBER_ID, { tag: 'private', selectable: false }),
  ];
}

const push = vi.fn();
const replace = vi.fn();

/** クエリを差し替えられる route のモック */
function mockRoute(query: Record<string, string> = {}) {
  const route = reactive({ query: { ...query } });
  vi.mocked(useRoute).mockReturnValue(route as never);
  return route;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push, replace } as never);
  mockRoute();
});

describe('既定の選択', () => {
  it('?member= が無ければ自分が選ばれる', () => {
    // Arrange & Act
    const { selectedMemberId, isMineSelected } = usePlayMemoSelection(() =>
      makeEntries(),
    );

    // Assert
    expect(selectedMemberId.value).toBe(MY_MEMBER_ID);
    expect(isMineSelected.value).toBe(true);
  });

  it('メンバーでない閲覧者には先頭の公開メモが選ばれる', () => {
    // Arrange
    const entries = makeEntries().map((entry) => ({ ...entry, isMe: false }));

    // Act
    const { selectedMemberId, isMineSelected } = usePlayMemoSelection(
      () => entries,
    );

    // Assert
    expect(selectedMemberId.value).toBe(SHARED_MEMBER_ID);
    expect(isMineSelected.value).toBe(false);
  });

  it('既定の選択では URL を書き換えない', async () => {
    // Arrange & Act
    usePlayMemoSelection(() => makeEntries());
    await flushPromises();

    // Assert
    expect(replace).not.toHaveBeenCalled();
  });

  it('選択できるメンバーが1人も居なければ null', () => {
    // Arrange
    const entries = [
      makeEntry(PRIVATE_MEMBER_ID, { tag: 'private', selectable: false }),
    ];

    // Act
    const { selectedMemberId, selectedEntry } = usePlayMemoSelection(
      () => entries,
    );

    // Assert
    expect(selectedMemberId.value).toBeNull();
    expect(selectedEntry.value).toBeNull();
  });
});

describe('?member= の指定', () => {
  it('読める相手を指定すればその人が選ばれる', () => {
    // Arrange
    mockRoute({ member: SHARED_MEMBER_ID });

    // Act
    const { selectedMemberId } = usePlayMemoSelection(() => makeEntries());

    // Assert
    expect(selectedMemberId.value).toBe(SHARED_MEMBER_ID);
  });

  it('読めない相手を指定されたら既定の選択へ replace で落とす', async () => {
    // Arrange
    mockRoute({ member: PRIVATE_MEMBER_ID });

    // Act
    const { selectedMemberId } = usePlayMemoSelection(() => makeEntries());
    await flushPromises();

    // Assert
    expect(selectedMemberId.value).toBe(MY_MEMBER_ID);
    expect(replace).toHaveBeenCalledWith({ query: { member: MY_MEMBER_ID } });
  });

  it('存在しないメンバー ID も既定の選択へ落とす', async () => {
    // Arrange
    mockRoute({ member: 'member-unknown' });

    // Act
    const { selectedMemberId } = usePlayMemoSelection(() => makeEntries());
    await flushPromises();

    // Assert
    expect(selectedMemberId.value).toBe(MY_MEMBER_ID);
    expect(replace).toHaveBeenCalled();
  });

  it('選択できるメンバーが居なければ member クエリを外す', async () => {
    // Arrange
    mockRoute({ member: PRIVATE_MEMBER_ID });
    const entries = [
      makeEntry(PRIVATE_MEMBER_ID, { tag: 'private', selectable: false }),
    ];

    // Act
    usePlayMemoSelection(() => entries);
    await flushPromises();

    // Assert
    expect(replace).toHaveBeenCalledWith({ query: {} });
  });

  it('メンバーがまだ読み込まれていない間は URL を書き換えない', async () => {
    // Arrange
    mockRoute({ member: SHARED_MEMBER_ID });
    const entries = ref<PlayMemoMemberEntry[]>([]);

    // Act
    const { selectedMemberId } = usePlayMemoSelection(entries);
    await flushPromises();

    // Assert
    expect(selectedMemberId.value).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('読み込みが終わって読める相手だと分かれば書き換えない', async () => {
    // Arrange
    mockRoute({ member: SHARED_MEMBER_ID });
    const entries = ref<PlayMemoMemberEntry[]>([]);
    const { selectedMemberId } = usePlayMemoSelection(entries);

    // Act
    entries.value = makeEntries();
    await flushPromises();

    // Assert
    expect(selectedMemberId.value).toBe(SHARED_MEMBER_ID);
    expect(replace).not.toHaveBeenCalled();
  });
});

describe('select', () => {
  it('選んだメンバーを ?member= に載せる', () => {
    // Arrange
    const { select } = usePlayMemoSelection(() => makeEntries());

    // Act
    select(SHARED_MEMBER_ID);

    // Assert
    expect(push).toHaveBeenCalledWith({ query: { member: SHARED_MEMBER_ID } });
  });

  it('他のクエリは残す', () => {
    // Arrange
    mockRoute({ token: 'guest-token' });
    const { select } = usePlayMemoSelection(() => makeEntries());

    // Act
    select(SHARED_MEMBER_ID);

    // Assert
    expect(push).toHaveBeenCalledWith({
      query: { token: 'guest-token', member: SHARED_MEMBER_ID },
    });
  });
});

describe('selectedEntry', () => {
  it('選択中のメンバーの行を返す', () => {
    // Arrange
    mockRoute({ member: SHARED_MEMBER_ID });

    // Act
    const { selectedEntry } = usePlayMemoSelection(() => makeEntries());

    // Assert
    expect(selectedEntry.value?.memberId).toBe(SHARED_MEMBER_ID);
  });
});
