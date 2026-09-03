import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { useCanOpenGameSession } from '@/features/Lobby/Detail/composables/useCanOpenGameSession';
import type { LobbyDetailModel } from '@/models/lobby';

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';

function makeLobby(status: LobbyStatus): LobbyDetailModel {
  return {
    id: 'lobby-1',
    hostUserId: HOST_USER_ID,
    title: 'テストロビー',
    scenarioName: null,
    description: null,
    location: null,
    maxPlayers: null,
    status,
    publishedAt: null,
    closedAt: null,
    disbandedAt: null,
    deadlineAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    entries: [],
    activeEntries: [],
    schedulePolls: [],
  } as unknown as LobbyDetailModel;
}

function signInAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as unknown as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  vi.clearAllMocks();
  signInAs(HOST_USER_ID);
});

describe('useCanOpenGameSession', () => {
  // 受付を閉じてから日程と参加者を決めるのが通常の流れなので、
  // closed でも開催を追加できないと詰まる（shared の LOBBY_ACTION_POLICIES）
  it.each([LobbyStatus.draft, LobbyStatus.open, LobbyStatus.closed])(
    '%s のロビーではホストが開催を追加できる',
    (status) => {
      // Arrange
      const lobby = ref(makeLobby(status));

      // Act
      const { canOpenGameSession } = useCanOpenGameSession(() => lobby.value);

      // Assert
      expect(canOpenGameSession.value).toBe(true);
    },
  );

  it('解散したロビーでは追加できない', () => {
    // Arrange
    const lobby = ref(makeLobby(LobbyStatus.disbanded));

    // Act
    const { canOpenGameSession } = useCanOpenGameSession(() => lobby.value);

    // Assert
    expect(canOpenGameSession.value).toBe(false);
  });

  it('ホスト以外は追加できない', () => {
    // Arrange
    signInAs(OTHER_USER_ID);
    const lobby = ref(makeLobby(LobbyStatus.open));

    // Act
    const { canOpenGameSession } = useCanOpenGameSession(() => lobby.value);

    // Assert
    expect(canOpenGameSession.value).toBe(false);
  });

  it('ロビー未取得のあいだは追加できない', () => {
    // Arrange
    const lobby = ref<LobbyDetailModel | null>(null);

    // Act
    const { canOpenGameSession } = useCanOpenGameSession(() => lobby.value);

    // Assert
    expect(canOpenGameSession.value).toBe(false);
  });
});
