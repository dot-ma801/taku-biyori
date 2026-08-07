import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PlayMemoDisplay from '@/features/GameSession/PlayMemo/PlayMemoDisplay.vue';
import { useAuthStore } from '@/stores/auth';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionDetail, GameSessionMember } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  getMyPlayMemo: vi.fn(),
  updateMyPlayMemoVisibility: vi.fn(),
  listSharedPlayMemos: vi.fn(),
}));

import { getMyPlayMemo, listSharedPlayMemos } from '@/api/game-session';

const HOST_USER_ID = 'user-host';

function makeMember(
  overrides: Partial<GameSessionMember> = {},
): GameSessionMember {
  return {
    id: 'member-1',
    userId: 'user-member',
    userName: 'テストユーザー',
    guestName: null,
    characterName: null,
    joinedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeGameSession(
  overrides: Partial<GameSessionDetail> = {},
): GameSessionDetail {
  return {
    id: 'session-1',
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

function mountDisplay(gameSession: GameSessionDetail = makeGameSession()) {
  return mount(PlayMemoDisplay, {
    props: { gameSession },
    global: {
      stubs: { RouterLink: true },
    },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.mocked(getMyPlayMemo).mockResolvedValue({
    memberId: 'member-1',
    body: '',
    sharedAt: null,
    updatedAt: null,
  });
  vi.mocked(listSharedPlayMemos).mockResolvedValue([]);
});

describe('セッション復元前（authStore.initialized === false）', () => {
  it('非メンバー枠（ログイン導線）を出さない', () => {
    // Arrange: 復元前は未ログイン相当だが、まだ確定していない状態
    const authStore = useAuthStore();
    authStore.initialized = false;

    // Act: 自分がメンバーに含まれない卓（非メンバー視点）
    const wrapper = mountDisplay(makeGameSession({ members: [] }));

    // Assert: 復元前にログイン導線を誤って出さない
    expect(wrapper.text()).not.toContain(
      'メモを書けるのは、ログインしているメンバーだけです',
    );
  });
});

describe('セッション復元後（authStore.initialized === true）', () => {
  it('未ログインならログイン導線を出す', () => {
    // Arrange
    const authStore = useAuthStore();
    authStore.initialized = true;

    // Act: 自分がメンバーに含まれない卓（非メンバー視点）、未ログイン
    const wrapper = mountDisplay(makeGameSession({ members: [] }));

    // Assert
    expect(wrapper.text()).toContain(
      'メモを書けるのは、ログインしているメンバーだけです',
    );
  });
});
