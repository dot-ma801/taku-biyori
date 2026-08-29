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
    publishedAt: new Date('2026-08-01T00:00:00.000Z'),
    openUntil: null,
    receptionClosedAt: null,
    disbandedAt: null,
  }),
  findCandidateOwner: vi
    .fn()
    .mockResolvedValue({ lobbyId: 'lobby-1', date: '2025-10-01' }),
  findActiveEntryByUserId: vi.fn().mockResolvedValue('member-1'),
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
      findActiveEntryByUserId: vi.fn().mockResolvedValue(null),
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
        publishedAt: null,
        openUntil: null,
        receptionClosedAt: null,
        disbandedAt: null,
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

  it('closed（受付終了）のロビーでも回答できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        publishedAt: new Date('2026-08-01T00:00:00.000Z'),
        openUntil: '2020-01-01',
        receptionClosedAt: null,
        disbandedAt: null,
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

  it('disbanded のロビーは invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        publishedAt: new Date('2026-08-01T00:00:00.000Z'),
        openUntil: null,
        receptionClosedAt: null,
        disbandedAt: new Date('2025-01-01'),
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
