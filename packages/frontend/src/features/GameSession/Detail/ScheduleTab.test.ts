import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { LobbyStatus } from '@taku-biyori/shared';
import ScheduleTab from '@/features/GameSession/Detail/ScheduleTab.vue';
import type { LobbyDetailModel } from '@/models/lobby';

vi.mock('@/stores/auth', () => ({ useAuthStore: vi.fn() }));

import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';

const lobby = {
  id: 'lobby-1',
  hostUserId: HOST_USER_ID,
  status: LobbyStatus.closed,
  maxPlayers: null,
  entries: [],
  activeEntries: [],
  schedulePolls: [{ id: 'poll-1', createdAt: new Date() }],
} as unknown as LobbyDetailModel;

const mountTab = (hasPendingSchedulePoll: boolean) =>
  mount(ScheduleTab, {
    props: { lobby, isHost: true, hasPendingSchedulePoll },
    shallow: true,
  });

beforeEach(() => {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: HOST_USER_ID },
  } as unknown as ReturnType<typeof useAuthStore>);
});

describe('ScheduleTab', () => {
  it('確定待ちの日程調整があれば確定の導線を出す', () => {
    // Arrange / Act
    const wrapper = mountTab(true);

    // Assert
    expect(wrapper.find('.schedule-tab__actions').exists()).toBe(true);
  });

  // 確定後もボタンが残ると、同じロビーに開催を二重に作れてしまう
  it('確定済みなら確定の導線を出さない', () => {
    // Arrange / Act
    const wrapper = mountTab(false);

    // Assert
    expect(wrapper.find('.schedule-tab__actions').exists()).toBe(false);
  });
});
