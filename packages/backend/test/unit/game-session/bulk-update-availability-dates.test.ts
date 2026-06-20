import { describe, expect, it, vi } from 'vitest';
import { bulkUpdateAvailabilityDates } from '@/game-session/application/bulk-update-availability-dates';
import type { BulkUpdateAvailabilityDatesRepository } from '@/game-session/application/bulk-update-availability-dates';
import type { AvailabilityDate } from '@taku-biyori/shared';

const mockDates: AvailabilityDate[] = [
  { id: 'date-1', date: '2025-10-01', answers: [] },
  { id: 'date-2', date: '2025-10-02', answers: [] },
];

const makeRepo = (
  overrides: Partial<BulkUpdateAvailabilityDatesRepository> = {},
): BulkUpdateAvailabilityDatesRepository => ({
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: true,
    openUntil: null,
    scheduledAt: null,
    completedAt: null,
  }),
  replaceAllDates: vi.fn().mockResolvedValue(mockDates),
  ...overrides,
});

describe('bulkUpdateAvailabilityDates', () => {
  it('ホストが候補日を一括更新できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'session-1',
      'user-1',
      {
        dates: ['2025-10-01', '2025-10-02'],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', dates: mockDates });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findHostUserId: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'nonexistent',
      'user-1',
      {
        dates: ['2025-10-01'],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('ホスト以外は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findHostUserId: vi.fn().mockResolvedValue('other-user'),
    });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'session-1',
      'user-1',
      {
        dates: ['2025-10-01'],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('日程が確定済みの場合は conflict を返す', async () => {
    // Arrange
    // confirmed ステータス: 公開済み・openUntil が過去・scheduledAt 設定済み・完了なし
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: new Date('2026-01-01'),
        scheduledAt: new Date('2026-06-30'),
        completedAt: null,
      }),
    });

    // Act
    const result = await bulkUpdateAvailabilityDates(
      repo,
      'session-1',
      'user-1',
      {
        dates: ['2026-07-01'],
      },
    );

    // Assert
    expect(result).toEqual({ type: 'conflict' });
  });

  it('replaceAllDates に gameSessionId と dates を渡す', async () => {
    // Arrange
    const replaceAllDates = vi.fn().mockResolvedValue(mockDates);
    const repo = makeRepo({ replaceAllDates });

    // Act
    await bulkUpdateAvailabilityDates(repo, 'session-1', 'user-1', {
      dates: ['2025-10-01', '2025-10-02'],
    });

    // Assert
    expect(replaceAllDates).toHaveBeenCalledWith('session-1', [
      '2025-10-01',
      '2025-10-02',
    ]);
  });
});
