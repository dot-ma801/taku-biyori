import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCreateGameSession } from '@/features/GameSession/Edit/useCreateGameSession';
import type { GameSession } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  createGameSession: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

import { createGameSession } from '@/api/game-session';

const SCHEDULED_AT = '2025-06-15';

const mockGameSession: GameSession = {
  id: 'session-1',
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  location: null,
  maxMembers: null,
  status: GameSessionStatus.draft,
  isPublished: false,
  scheduledAt: SCHEDULED_AT,
  completedAt: null,
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createGameSession).mockResolvedValue(mockGameSession);
});

describe('useCreateGameSession', () => {
  describe('募集人数のバリデーション', () => {
    it('1（下限未満）を入力すると送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, scheduledAt, maxMembers, errorMessage, submit } =
        useCreateGameSession();
      title.value = '卓';
      scheduledAt.value = SCHEDULED_AT;
      maxMembers.value = '1';

      // Act
      await submit();

      // Assert
      expect(createGameSession).not.toHaveBeenCalled();
      expect(errorMessage.value).toBe(
        '募集人数は2〜20人の範囲で入力してください',
      );
    });

    it('21（上限超過）を入力すると送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, scheduledAt, maxMembers, errorMessage, submit } =
        useCreateGameSession();
      title.value = '卓';
      scheduledAt.value = SCHEDULED_AT;
      maxMembers.value = '21';

      // Act
      await submit();

      // Assert
      expect(createGameSession).not.toHaveBeenCalled();
      expect(errorMessage.value).toBe(
        '募集人数は2〜20人の範囲で入力してください',
      );
    });

    it('2（下限）を入力すると maxMembers: 2 で送信する', async () => {
      // Arrange
      const { title, scheduledAt, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
      scheduledAt.value = SCHEDULED_AT;
      maxMembers.value = '2';

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.objectContaining({ maxMembers: 2 }),
      );
    });

    it('20（上限）を入力すると maxMembers: 20 で送信する', async () => {
      // Arrange
      const { title, scheduledAt, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
      scheduledAt.value = SCHEDULED_AT;
      maxMembers.value = '20';

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.objectContaining({ maxMembers: 20 }),
      );
    });

    it('未入力なら maxMembers を含めずに送信する', async () => {
      // Arrange
      const { title, scheduledAt, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
      scheduledAt.value = SCHEDULED_AT;
      maxMembers.value = '';

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.not.objectContaining({ maxMembers: expect.anything() }),
      );
    });
  });

  describe('開催日（日程必須）', () => {
    it('開催日が未入力なら送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, errorMessage, submit } = useCreateGameSession();
      title.value = '卓';

      // Act
      await submit();

      // Assert
      expect(createGameSession).not.toHaveBeenCalled();
      expect(errorMessage.value).toBe('開催日を選択してください');
    });

    it('開催日を入力すると scheduledAt を含めて送信する', async () => {
      // Arrange
      const { title, scheduledAt, submit } = useCreateGameSession();
      title.value = '卓';
      scheduledAt.value = SCHEDULED_AT;

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.objectContaining({ scheduledAt: SCHEDULED_AT }),
      );
    });
  });

  // 募集締め切り（openUntil）は募集枠（lobby）の関心事。段階6b で卓の入力から削除した
  it('openUntil を送信しない', async () => {
    // Arrange
    const { title, scheduledAt, submit } = useCreateGameSession();
    title.value = '卓';
    scheduledAt.value = SCHEDULED_AT;

    // Act
    await submit();

    // Assert
    expect(createGameSession).toHaveBeenCalledWith(
      expect.not.objectContaining({ openUntil: expect.anything() }),
    );
  });
});
