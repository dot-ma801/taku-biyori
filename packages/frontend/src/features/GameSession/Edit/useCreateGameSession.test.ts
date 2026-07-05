import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCreateGameSession } from '@/features/GameSession/Edit/useCreateGameSession';
import type { GameSession } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  createGameSession: vi.fn(),
  bulkUpdateAvailabilityDates: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

import { createGameSession } from '@/api/game-session';

const mockGameSession: GameSession = {
  id: 'session-1',
  title: 'テスト卓',
  scenarioName: null,
  description: null,
  location: null,
  maxMembers: null,
  status: 'draft',
  isPublished: false,
  openUntil: null,
  scheduledAt: null,
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
    it('1（下限未満）を入力すると maxMembers を含めずに送信する', async () => {
      // Arrange
      const { title, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
      maxMembers.value = '1';

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.not.objectContaining({ maxMembers: expect.anything() }),
      );
    });

    it('21（上限超過）を入力すると maxMembers を含めずに送信する', async () => {
      // Arrange
      const { title, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
      maxMembers.value = '21';

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.not.objectContaining({ maxMembers: expect.anything() }),
      );
    });

    it('2（下限）を入力すると maxMembers: 2 で送信する', async () => {
      // Arrange
      const { title, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
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
      const { title, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
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
      const { title, maxMembers, submit } = useCreateGameSession();
      title.value = '卓';
      maxMembers.value = '';

      // Act
      await submit();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        expect.not.objectContaining({ maxMembers: expect.anything() }),
      );
    });
  });
});
