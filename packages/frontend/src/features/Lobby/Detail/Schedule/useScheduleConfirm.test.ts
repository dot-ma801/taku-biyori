import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useScheduleConfirm } from '@/features/Lobby/Detail/Schedule/useScheduleConfirm';
import { LobbyStatus } from '@taku-biyori/shared';

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';

function setupAuthAs(userId: string | undefined) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: userId ? { id: userId } : null,
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('isHost', () => {
  it('ログインユーザーが hostUserId と一致するとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);

    // Act
    const { isHost } = useScheduleConfirm(HOST_USER_ID, LobbyStatus.open);

    // Assert
    expect(isHost.value).toBe(true);
  });

  it('ログインユーザーが hostUserId と一致しないとき false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);

    // Act
    const { isHost } = useScheduleConfirm(HOST_USER_ID, LobbyStatus.open);

    // Assert
    expect(isHost.value).toBe(false);
  });
});

describe('canConfirm', () => {
  it('ホストかつ status が open のとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(HOST_USER_ID, LobbyStatus.open);

    // Assert
    expect(canConfirm.value).toBe(true);
  });

  it('ホストかつ status が scheduling のとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(
      HOST_USER_ID,
      LobbyStatus.scheduling,
    );

    // Assert
    expect(canConfirm.value).toBe(true);
  });

  it('ホスト以外は status が open でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(HOST_USER_ID, LobbyStatus.open);

    // Assert
    expect(canConfirm.value).toBe(false);
  });

  it.each([
    ['draft', LobbyStatus.draft],
    ['confirmed', LobbyStatus.confirmed],
    ['cancelled', LobbyStatus.cancelled],
    ['undefined', undefined],
  ])('ホストでも status が %s のとき false を返す', (_label, status) => {
    // Arrange
    setupAuthAs(HOST_USER_ID);

    // Act
    const { canConfirm } = useScheduleConfirm(HOST_USER_ID, status);

    // Assert
    expect(canConfirm.value).toBe(false);
  });

  it('未ログインのとき false を返す', () => {
    // Arrange
    setupAuthAs(undefined);

    // Act
    const { canConfirm } = useScheduleConfirm(HOST_USER_ID, LobbyStatus.open);

    // Assert
    expect(canConfirm.value).toBe(false);
  });
});
