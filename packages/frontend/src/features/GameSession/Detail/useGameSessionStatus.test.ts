import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useGameSessionStatus } from '@/features/GameSession/Detail/useGameSessionStatus';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionDetail } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  updateGameSessionStatus: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

import { updateGameSessionStatus } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const OTHER_USER_ID = 'other-user-id';
const SESSION_ID = 'session-id';

function makeGameSession(
  overrides: Partial<GameSessionDetail> = {},
): GameSessionDetail {
  return {
    id: SESSION_ID,
    title: 'テストセッション',
    status: GameSessionStatus.draft,
    isPublished: false,
    createdBy: HOST_USER_ID,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
}

function setupAuthAs(userId: string) {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: userId },
  } as ReturnType<typeof useAuthStore>);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('isHost', () => {
  it('currentUser.id が createdBy と一致するとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(makeGameSession());

    // Act
    const { isHost } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(isHost.value).toBe(true);
  });

  it('currentUser.id が createdBy と異なるとき false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const gameSession = ref(makeGameSession());

    // Act
    const { isHost } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(isHost.value).toBe(false);
  });

  it('gameSession が null のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref<GameSessionDetail | null>(null);

    // Act
    const { isHost } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(isHost.value).toBe(false);
  });
});

describe('canPublish', () => {
  it('ホストかつ status が draft のとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.draft }));

    // Act
    const { canPublish } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(canPublish.value).toBe(true);
  });

  it('ホストでも status が draft 以外のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.open }));

    // Act
    const { canPublish } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(canPublish.value).toBe(false);
  });

  it('ホスト以外は status が draft でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.draft }));

    // Act
    const { canPublish } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(canPublish.value).toBe(false);
  });
});

describe('canComplete', () => {
  it('ホストかつ status が today のとき true を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.today }));

    // Act
    const { canComplete } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(canComplete.value).toBe(true);
  });

  it('ホストでも status が today 以外のとき false を返す', () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.confirmed }));

    // Act
    const { canComplete } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(canComplete.value).toBe(false);
  });

  it('ホスト以外は status が today でも false を返す', () => {
    // Arrange
    setupAuthAs(OTHER_USER_ID);
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.today }));

    // Act
    const { canComplete } = useGameSessionStatus(SESSION_ID, gameSession);

    // Assert
    expect(canComplete.value).toBe(false);
  });
});

describe('publishSession', () => {
  it('updateGameSessionStatus を status: open で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateGameSessionStatus).mockResolvedValue({
      id: SESSION_ID,
      title: 'テストセッション',
      status: GameSessionStatus.open,
      isPublished: true,
      createdBy: HOST_USER_ID,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.draft }));
    const { publishSession } = useGameSessionStatus(SESSION_ID, gameSession);

    // Act
    await publishSession();

    // Assert
    expect(updateGameSessionStatus).toHaveBeenCalledWith(SESSION_ID, {
      status: 'open',
    });
  });

  it('成功後に loading が false に戻る', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateGameSessionStatus).mockResolvedValue({
      id: SESSION_ID,
      title: 'テストセッション',
      status: GameSessionStatus.open,
      isPublished: true,
      createdBy: HOST_USER_ID,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const gameSession = ref(makeGameSession());
    const { publishSession, loading } = useGameSessionStatus(SESSION_ID, gameSession);

    // Act
    await publishSession();

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API エラー時に errorMessage がセットされる', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateGameSessionStatus).mockRejectedValue(new Error('サーバーエラー'));
    const gameSession = ref(makeGameSession());
    const { publishSession, errorMessage } = useGameSessionStatus(SESSION_ID, gameSession);

    // Act
    await publishSession();

    // Assert
    expect(errorMessage.value).toBe('公開に失敗しました');
  });
});

describe('completeSession', () => {
  it('updateGameSessionStatus を status: completed で呼び出す', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateGameSessionStatus).mockResolvedValue({
      id: SESSION_ID,
      title: 'テストセッション',
      status: GameSessionStatus.completed,
      isPublished: true,
      createdBy: HOST_USER_ID,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.today }));
    const { completeSession } = useGameSessionStatus(SESSION_ID, gameSession);

    // Act
    await completeSession();

    // Assert
    expect(updateGameSessionStatus).toHaveBeenCalledWith(SESSION_ID, {
      status: 'completed',
    });
  });

  it('API エラー時に errorMessage がセットされる', async () => {
    // Arrange
    setupAuthAs(HOST_USER_ID);
    vi.mocked(updateGameSessionStatus).mockRejectedValue(new Error('サーバーエラー'));
    const gameSession = ref(makeGameSession({ status: GameSessionStatus.today }));
    const { completeSession, errorMessage } = useGameSessionStatus(SESSION_ID, gameSession);

    // Act
    await completeSession();

    // Assert
    expect(errorMessage.value).toBe('完了への変更に失敗しました');
  });
});
