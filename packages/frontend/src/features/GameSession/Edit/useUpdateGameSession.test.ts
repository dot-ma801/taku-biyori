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
const SCHEDULED_AT = '2025-06-15';

const mockGameSessionDetail: GameSessionDetail = {
  id: SESSION_ID,
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  location: null,
  maxMembers: 4,
  status: GameSessionStatus.draft,
  isPublished: false,
  scheduledAt: SCHEDULED_AT,
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
      const { scheduledAt, maxMembers, errorMessage, submit } =
        useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;
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
      const { scheduledAt, maxMembers, errorMessage, submit } =
        useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;
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
      const { scheduledAt, maxMembers, submit } =
        useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;
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
      const { scheduledAt, maxMembers, submit } =
        useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;
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
      const { scheduledAt, maxMembers, submit } =
        useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;
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

  describe('開催日（日程必須）', () => {
    it('開催日が未入力なら送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { scheduledAt, errorMessage, submit } =
        useUpdateGameSession(SESSION_ID);
      scheduledAt.value = '';

      // Act
      await submit();

      // Assert
      expect(updateGameSession).not.toHaveBeenCalled();
      expect(errorMessage.value).toBe('開催日を選択してください');
    });

    it('開催日を入力すると scheduledAt を含めて送信する', async () => {
      // Arrange
      const { scheduledAt, submit } = useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;

      // Act
      await submit();

      // Assert
      expect(updateGameSession).toHaveBeenCalledWith(
        SESSION_ID,
        expect.objectContaining({ scheduledAt: SCHEDULED_AT }),
      );
    });
  });

  describe('募集締め切り（openUntil）', () => {
    // 募集は募集枠（lobby）の関心事。卓の編集では openUntil を送らず、
    // サーバ側の値をそのまま保持する（送ると null 化されて open へ戻ってしまう）
    it('openUntil を送信しない', async () => {
      // Arrange
      const { scheduledAt, submit } = useUpdateGameSession(SESSION_ID);
      scheduledAt.value = SCHEDULED_AT;

      // Act
      await submit();

      // Assert
      expect(updateGameSession).toHaveBeenCalledWith(
        SESSION_ID,
        expect.not.objectContaining({ openUntil: expect.anything() }),
      );
    });
  });
});
