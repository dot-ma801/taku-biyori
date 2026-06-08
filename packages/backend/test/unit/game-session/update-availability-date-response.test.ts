import { describe, expect, it, vi } from 'vitest';
import { updateAvailabilityDateResponse } from '@/game-session/application/update-availability-date-response';
import type { UpdateAvailabilityDateResponseRepository } from '@/game-session/application/update-availability-date-response';
import type { AvailabilityDateAnswer } from '@taku-biyori/shared';

const mockAnswer: AvailabilityDateAnswer = {
  id: 'answer-1',
  memberId: 'member-1',
  answer: 'ok',
  comment: null,
};

const makeRepo = (
  overrides: Partial<UpdateAvailabilityDateResponseRepository> = {},
): UpdateAvailabilityDateResponseRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  findCandidateOwner: vi
    .fn()
    .mockResolvedValue({ gameSessionId: 'session-1', date: '2025-10-01' }),
  findMemberByUserId: vi.fn().mockResolvedValue('member-1'),
  upsertAnswer: vi.fn().mockResolvedValue(mockAnswer),
  ...overrides,
});

describe('updateAvailabilityDateResponse', () => {
  it('メンバーが自分の回答を登録できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'session-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'nonexistent',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('存在しない候補日IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'session-1',
      'nonexistent',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('候補日が別セッションに属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi
        .fn()
        .mockResolvedValue({
          gameSessionId: 'other-session',
          date: '2025-10-01',
        }),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'session-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('セッションのメンバーでないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'session-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('upsertAnswer に candidateId・memberId・input を渡す', async () => {
    // Arrange
    const upsertAnswer = vi.fn().mockResolvedValue(mockAnswer);
    const repo = makeRepo({ upsertAnswer });

    // Act
    await updateAvailabilityDateResponse(
      repo,
      'session-1',
      'date-1',
      'user-1',
      {
        answer: 'maybe',
        comment: 'たぶん行ける',
      },
    );

    // Assert
    expect(upsertAnswer).toHaveBeenCalledWith('date-1', 'member-1', {
      answer: 'maybe',
      comment: 'たぶん行ける',
    });
  });
});
