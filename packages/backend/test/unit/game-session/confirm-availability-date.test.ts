import { describe, expect, it, vi } from 'vitest';
import { confirmAvailabilityDate } from '@/game-session/application/confirm-availability-date';
import type { ConfirmAvailabilityDateRepository } from '@/game-session/application/confirm-availability-date';
import type { GameSession } from '@taku-biyori/shared';

const mockGameSession: GameSession = {
  id: 'session-1',
  title: 'テスト卓',
  status: 'confirmed',
  isPublished: true,
  scheduledAt: '2025-09-01',
  createdBy: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<ConfirmAvailabilityDateRepository> = {},
): ConfirmAvailabilityDateRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findCandidateOwner: vi
    .fn()
    .mockResolvedValue({ gameSessionId: 'session-1', date: '2025-09-01' }),
  setScheduledAt: vi.fn().mockResolvedValue(mockGameSession),
  ...overrides,
});

describe('confirmAvailabilityDate', () => {
  it('ホストが候補日を確定できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await confirmAvailabilityDate(repo, 'date-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', gameSession: mockGameSession });
  });

  it('存在しない候補日IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await confirmAvailabilityDate(repo, 'nonexistent', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
    });

    // Act
    const result = await confirmAvailabilityDate(repo, 'date-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('setScheduledAt に gameSessionId と date を渡す', async () => {
    // Arrange
    const setScheduledAt = vi.fn().mockResolvedValue(mockGameSession);
    const repo = makeRepo({ setScheduledAt });

    // Act
    await confirmAvailabilityDate(repo, 'date-1', 'user-1');

    // Assert
    expect(setScheduledAt).toHaveBeenCalledWith('session-1', '2025-09-01');
  });
});
