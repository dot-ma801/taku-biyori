import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { LobbyEntryModel } from '@/models/lobby';

// useSession（nanostores の Atom）のモック。
// get() は現在値を返し、subscribe() はコールバックを保持して後から発火できるようにする。
let sessionSubscribers: Array<(v: SessionValue) => void> = [];
let currentSessionValue: SessionValue = { data: null };

type SessionValue = { data: { user?: { id?: string | null } } | null };

vi.mock('@/lib/auth', () => ({
  useSession: {
    get: vi.fn(() => currentSessionValue),
    subscribe: vi.fn((cb: (v: SessionValue) => void) => {
      sessionSubscribers.push(cb);
      return () => {
        sessionSubscribers = sessionSubscribers.filter((s) => s !== cb);
      };
    }),
  },
}));

import { useMyLobbyMemberId } from '@/features/Lobby/Detail/composables/useMyLobbyMemberId';

function setSession(value: SessionValue) {
  currentSessionValue = value;
  sessionSubscribers.forEach((cb) => cb(value));
}

function makeMember(overrides: Partial<LobbyEntryModel> = {}): LobbyEntryModel {
  return {
    id: 'member-1',
    userId: 'user-1',
    userName: 'たろう',
    guestName: null,
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    leftAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  sessionSubscribers = [];
  currentSessionValue = { data: null };
  vi.clearAllMocks();
});

describe('useMyLobbyMemberId', () => {
  it('ログイン中で members に自分がいる場合、myMemberId がその member の id になる', () => {
    // Arrange
    currentSessionValue = { data: { user: { id: 'user-1' } } };
    const members = [makeMember({ id: 'member-1', userId: 'user-1' })];

    // Act
    const { myMemberId } = useMyLobbyMemberId(members);

    // Assert
    expect(myMemberId.value).toBe('member-1');
  });

  it('未ログインの場合、myMemberId は null になる', () => {
    // Arrange
    currentSessionValue = { data: null };
    const members = [makeMember({ id: 'member-1', userId: 'user-1' })];

    // Act
    const { myMemberId } = useMyLobbyMemberId(members);

    // Assert
    expect(myMemberId.value).toBeNull();
  });

  it('ログイン中だが members に自分がいない場合、myMemberId は null になる', () => {
    // Arrange
    currentSessionValue = { data: { user: { id: 'user-999' } } };
    const members = [makeMember({ id: 'member-1', userId: 'user-1' })];

    // Act
    const { myMemberId } = useMyLobbyMemberId(members);

    // Assert
    expect(myMemberId.value).toBeNull();
  });

  it('ゲストメンバー（userId が null）は未ログイン時でも誤マッチしない', () => {
    // Arrange
    currentSessionValue = { data: null };
    const members = [
      makeMember({ id: 'member-guest', userId: null, guestName: 'ゲスト太郎' }),
    ];

    // Act
    const { myMemberId } = useMyLobbyMemberId(members);

    // Assert
    expect(myMemberId.value).toBeNull();
  });

  it('isJoined は参加済みなら true、未参加なら false になる', () => {
    // Arrange
    const members = [makeMember({ id: 'member-1', userId: 'user-1' })];

    // Act
    currentSessionValue = { data: { user: { id: 'user-1' } } };
    const { isJoined: isJoinedTrue } = useMyLobbyMemberId(members);

    currentSessionValue = { data: { user: { id: 'user-999' } } };
    const { isJoined: isJoinedFalse } = useMyLobbyMemberId(members);

    // Assert
    expect(isJoinedTrue.value).toBe(true);
    expect(isJoinedFalse.value).toBe(false);
  });

  it('members を getter で渡した場合、後から中身が変わると myMemberId も追従する', () => {
    // Arrange
    currentSessionValue = { data: { user: { id: 'user-1' } } };
    const membersRef = ref<LobbyEntryModel[]>([]);

    // Act
    const { myMemberId } = useMyLobbyMemberId(() => membersRef.value);

    // Assert（まだ自分がいない）
    expect(myMemberId.value).toBeNull();

    // Act（後から自分が加わる）
    membersRef.value = [makeMember({ id: 'member-1', userId: 'user-1' })];

    // Assert
    expect(myMemberId.value).toBe('member-1');
  });

  it('セッションが後から変わった場合（subscribe コールバック発火）myMemberId も追従する', () => {
    // Arrange
    currentSessionValue = { data: null };
    const members = [makeMember({ id: 'member-1', userId: 'user-1' })];

    // Act
    const { myMemberId } = useMyLobbyMemberId(members);

    // Assert（未ログインなので null）
    expect(myMemberId.value).toBeNull();

    // Act（ログイン状態に変わる）
    setSession({ data: { user: { id: 'user-1' } } });

    // Assert
    expect(myMemberId.value).toBe('member-1');
  });
});
