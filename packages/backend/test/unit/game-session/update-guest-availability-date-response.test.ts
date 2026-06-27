import { describe, expect, it, vi } from 'vitest';
import { updateGuestAvailabilityDateResponse } from '@/game-session/application/update-guest-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseRepository } from '@/game-session/application/update-guest-availability-date-response';
import type { AvailabilityDateAnswer } from '@taku-biyori/shared';
import { GameSessionStatus } from '@taku-biyori/shared';

const TOKEN = 'guest-token-abc';

const mockAnswer: AvailabilityDateAnswer = {
  id: 'answer-1',
  memberId: 'member-guest',
  answer: 'ok',
  comment: null,
};

const makeRepo = (
  overrides: Partial<UpdateGuestAvailabilityDateResponseRepository> = {},
): UpdateGuestAvailabilityDateResponseRepository => ({
  findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.open),
  findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
  findCandidateOwner: vi
    .fn()
    .mockResolvedValue({ gameSessionId: 'session-1', date: '2025-10-01' }),
  isGuestMember: vi.fn().mockResolvedValue(true),
  upsertAnswer: vi.fn().mockResolvedValue(mockAnswer),
  ...overrides,
});

const act = (
  repo: UpdateGuestAvailabilityDateResponseRepository,
  opts: {
    gameSessionId?: string;
    dateId?: string;
    token?: string;
    memberId?: string;
  } = {},
) =>
  updateGuestAvailabilityDateResponse(
    repo,
    opts.gameSessionId ?? 'session-1',
    opts.dateId ?? 'date-1',
    opts.token ?? TOKEN,
    opts.memberId ?? 'member-guest',
    { answer: 'ok' },
  );

describe('updateGuestAvailabilityDateResponse', () => {
  it('トークン一致かつゲストメンバーなら回答できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('セッションが存在しない（トークンnull）場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('トークンが一致しない場合は invalidToken を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await act(repo, { token: 'wrong-token' });

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
  });

  it('存在しない候補日IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo, { dateId: 'nonexistent' });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('候補日が別セッションに属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue({
        gameSessionId: 'other-session',
        date: '2025-10-01',
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('指定 memberId がゲストメンバーでない場合は forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      isGuestMember: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await act(repo, { memberId: 'member-logged-in' });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('upsertAnswer に candidateId・memberId・input を渡す', async () => {
    // Arrange
    const upsertAnswer = vi.fn().mockResolvedValue(mockAnswer);
    const repo = makeRepo({ upsertAnswer });

    // Act
    await updateGuestAvailabilityDateResponse(
      repo,
      'session-1',
      'date-1',
      TOKEN,
      'member-guest',
      { answer: 'maybe', comment: 'たぶん行ける' },
    );

    // Assert
    expect(upsertAnswer).toHaveBeenCalledWith('date-1', 'member-guest', {
      answer: 'maybe',
      comment: 'たぶん行ける',
    });
  });

  it('status が open のとき回答できる', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi.fn().mockResolvedValue(GameSessionStatus.open),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('status が scheduling のとき回答できる', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.scheduling),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('status が confirmed のとき locked を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.confirmed),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'locked' });
  });

  it('status が completed のとき locked を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.completed),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'locked' });
  });

  it('status が draft のとき locked を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.draft),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'locked' });
  });

  it('status が today のとき locked を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGameSessionStatus: vi
        .fn()
        .mockResolvedValue(GameSessionStatus.today),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'locked' });
  });
});
