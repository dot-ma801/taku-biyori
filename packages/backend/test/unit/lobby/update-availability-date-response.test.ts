import { describe, expect, it, vi } from 'vitest';
import { updateAvailabilityDateResponse } from '@/lobby/application/update-availability-date-response';
import type { UpdateAvailabilityDateResponseRepository } from '@/lobby/application/update-availability-date-response';
import type { LobbyAvailabilityDateAnswer } from '@taku-biyori/shared';

const mockAnswer: LobbyAvailabilityDateAnswer = {
  id: 'answer-1',
  memberId: 'member-1',
  answer: 'ok',
  comment: null,
};

const makeRepo = (
  overrides: Partial<UpdateAvailabilityDateResponseRepository> = {},
): UpdateAvailabilityDateResponseRepository => ({
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: true,
    openUntil: null,
    cancelledAt: null,
  }),
  findCandidateOwner: vi
    .fn()
    .mockResolvedValue({ lobbyId: 'lobby-1', date: '2025-10-01' }),
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
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue(null),
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
      'lobby-1',
      'nonexistent',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('候補日が別募集枠に属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue({
        lobbyId: 'other-lobby',
        date: '2025-10-01',
      }),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('募集枠のメンバーでないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberByUserId: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('draft の募集枠は notPublished を返す（公開前は回答できない）', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: false,
        openUntil: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'notPublished' });
  });

  it('scheduling の募集枠は回答できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: new Date('2020-01-01'),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('cancelled の募集枠は invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: null,
        cancelledAt: new Date('2025-01-01'),
      }),
    });

    // Act
    const result = await updateAvailabilityDateResponse(
      repo,
      'lobby-1',
      'date-1',
      'user-1',
      { answer: 'ok' },
    );

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('upsertAnswer に candidateId・memberId・input を渡す', async () => {
    // Arrange
    const upsertAnswer = vi.fn().mockResolvedValue(mockAnswer);
    const repo = makeRepo({ upsertAnswer });

    // Act
    await updateAvailabilityDateResponse(repo, 'lobby-1', 'date-1', 'user-1', {
      answer: 'maybe',
      comment: 'たぶん行ける',
    });

    // Assert
    expect(upsertAnswer).toHaveBeenCalledWith('date-1', 'member-1', {
      answer: 'maybe',
      comment: 'たぶん行ける',
    });
  });
});
