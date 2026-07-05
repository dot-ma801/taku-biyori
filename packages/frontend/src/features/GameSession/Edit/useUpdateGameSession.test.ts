import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateGameSession } from '@/features/GameSession/Edit/useUpdateGameSession';
import type { GameSessionDetail } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  getGameSession: vi.fn(),
  updateGameSession: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
}));

import { getGameSession, updateGameSession } from '@/api/game-session';

const SESSION_ID = 'session-1';

const mockGameSessionDetail: GameSessionDetail = {
  id: SESSION_ID,
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  location: null,
  maxMembers: 4,
  status: GameSessionStatus.draft,
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
  completedAt: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  members: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getGameSession).mockResolvedValue(mockGameSessionDetail);
  vi.mocked(updateGameSession).mockResolvedValue(mockGameSessionDetail);
});

describe('useUpdateGameSession', () => {
  describe('募集人数のバリデーション', () => {
    it('1（下限未満）を入力すると送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { maxMembers, errorMessage, submit } =
        useUpdateGameSession(SESSION_ID);
      maxMembers.value = '1';

      // Act
      await submit();

      // Assert
      expect(updateGameSession).not.toHaveBeenCalled();
      expect(errorMessage.value).toBe(
        '募集人数は2〜20人の範囲で入力してください',
      );
    });

    it('21（上限超過）を入力すると送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { maxMembers, errorMessage, submit } =
        useUpdateGameSession(SESSION_ID);
      maxMembers.value = '21';

      // Act
      await submit();

      // Assert
      expect(updateGameSession).not.toHaveBeenCalled();
      expect(errorMessage.value).toBe(
        '募集人数は2〜20人の範囲で入力してください',
      );
    });

    it('2（下限）を入力すると maxMembers: 2 で送信する', async () => {
      // Arrange
      const { maxMembers, submit } = useUpdateGameSession(SESSION_ID);
      maxMembers.value = '2';

      // Act
      await submit();

      // Assert
      expect(updateGameSession).toHaveBeenCalledWith(
        SESSION_ID,
        expect.objectContaining({ maxMembers: 2 }),
      );
    });

    it('20（上限）を入力すると maxMembers: 20 で送信する', async () => {
      // Arrange
      const { maxMembers, submit } = useUpdateGameSession(SESSION_ID);
      maxMembers.value = '20';

      // Act
      await submit();

      // Assert
      expect(updateGameSession).toHaveBeenCalledWith(
        SESSION_ID,
        expect.objectContaining({ maxMembers: 20 }),
      );
    });

    it('未入力なら maxMembers: null で送信する', async () => {
      // Arrange
      const { maxMembers, submit } = useUpdateGameSession(SESSION_ID);
      maxMembers.value = '';

      // Act
      await submit();

      // Assert
      expect(updateGameSession).toHaveBeenCalledWith(
        SESSION_ID,
        expect.objectContaining({ maxMembers: null }),
      );
    });
  });
});
