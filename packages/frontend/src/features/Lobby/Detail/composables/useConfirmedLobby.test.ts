import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

type SessionValue = { data: { user?: { id?: string | null } } | null };
let sessionSubscribers: Array<(v: SessionValue) => void> = [];
let currentSessionValue: SessionValue = { data: null };

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

import { useConfirmedLobby } from '@/features/Lobby/Detail/composables/useConfirmedLobby';

function setSession(userId: string | null) {
  currentSessionValue = { data: userId ? { user: { id: userId } } : null };
  sessionSubscribers.forEach((cb) => cb(currentSessionValue));
}

beforeEach(() => {
  currentSessionValue = { data: null };
  sessionSubscribers = [];
  vi.clearAllMocks();
});

const HOST_ID = 'host-user-id';
const MEMBER_ID = 'user-member-id';
const GAME_SESSION_ID = 'gs-1';

const baseLobby: LobbyDetail = {
  id: 'lobby-1',
  title: 'テスト',
  description: null,
  scenarioName: null,
  location: null,
  status: LobbyStatus.confirmed,
  isPublished: true,
  maxPlayers: null,
  openUntil: null,
  closedAt: '2026-07-18T10:00:00Z',
  cancelledAt: null,
  hostUserId: HOST_ID,
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-18T10:00:00Z',
  members: [
    {
      id: 'member-1',
      userId: HOST_ID,
      userName: 'ホスト',
      guestName: null,
      joinedAt: '2026-07-01T00:00:00Z',
    },
    {
      id: 'member-2',
      userId: MEMBER_ID,
      userName: 'メンバー',
      guestName: null,
      joinedAt: '2026-07-01T00:00:00Z',
    },
    {
      id: 'member-3',
      userId: 'user-not-selected',
      userName: '非選出',
      guestName: null,
      joinedAt: '2026-07-01T00:00:00Z',
    },
  ],
  confirmedGameSession: {
    id: GAME_SESSION_ID,
    selectedLobbyMemberIds: ['member-1', 'member-2'],
  },
};

describe('viewerKind', () => {
  it('ホストユーザーは selected を返す', () => {
    // Arrange
    setSession(HOST_ID);

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => null,
    );

    // Assert
    expect(viewerKind.value).toBe('selected');
  });

  it('選出されたメンバーは selected を返す', () => {
    // Arrange
    setSession(MEMBER_ID);

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => null,
    );

    // Assert
    expect(viewerKind.value).toBe('selected');
  });

  it('非選出のメンバーは notSelected を返す', () => {
    // Arrange
    setSession('user-not-selected');

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => null,
    );

    // Assert
    expect(viewerKind.value).toBe('notSelected');
  });

  it('未ログインユーザーは neutral を返す', () => {
    // Arrange
    setSession(null);

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => null,
    );

    // Assert
    expect(viewerKind.value).toBe('neutral');
  });

  it('招待リンク経由（token あり）の未ログインユーザーは guest を返す', () => {
    // Arrange
    setSession(null);

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => 'invite-token',
    );

    // Assert
    expect(viewerKind.value).toBe('guest');
  });

  it('token があってもログイン済みならユーザーとして判定する', () => {
    // Arrange
    setSession(HOST_ID);

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => 'invite-token',
    );

    // Assert
    expect(viewerKind.value).toBe('selected');
  });

  it('卓が未確定なら token があっても neutral を返す', () => {
    // Arrange
    setSession(null);
    const lobby: LobbyDetail = { ...baseLobby, confirmedGameSession: null };

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => lobby,
      () => 'invite-token',
    );

    // Assert
    expect(viewerKind.value).toBe('neutral');
  });

  it('ロビーのメンバーでない場合は neutral を返す', () => {
    // Arrange
    setSession('completely-unrelated-user');

    // Act
    const { viewerKind } = useConfirmedLobby(
      () => baseLobby,
      () => null,
    );

    // Assert
    expect(viewerKind.value).toBe('neutral');
  });
});

describe('gameSessionId', () => {
  it('confirmedGameSession.id を返す', () => {
    // Arrange
    setSession(HOST_ID);

    // Act
    const { gameSessionId } = useConfirmedLobby(
      () => baseLobby,
      () => null,
    );

    // Assert
    expect(gameSessionId.value).toBe(GAME_SESSION_ID);
  });

  it('confirmedGameSession がない場合は null を返す', () => {
    // Arrange
    setSession(HOST_ID);
    const lobby: LobbyDetail = { ...baseLobby, confirmedGameSession: null };

    // Act
    const { gameSessionId } = useConfirmedLobby(
      () => lobby,
      () => null,
    );

    // Assert
    expect(gameSessionId.value).toBeNull();
  });
});
