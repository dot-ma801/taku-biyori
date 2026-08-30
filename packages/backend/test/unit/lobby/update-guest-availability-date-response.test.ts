import { describe, expect, it, vi } from 'vitest';
import { updateGuestAvailabilityDateResponse } from '@/lobby/application/update-guest-availability-date-response';
import type { UpdateGuestAvailabilityDateResponseRepository } from '@/lobby/application/update-guest-availability-date-response';
import type { LobbyAvailabilityDateAnswer } from '@taku-biyori/shared';

const TOKEN = 'guest-token-abc';

const mockAnswer: LobbyAvailabilityDateAnswer = {
  id: 'answer-1',
  memberId: 'member-guest',
  answer: 'ok',
  comment: null,
};

const makeRepo = (
  overrides: Partial<UpdateGuestAvailabilityDateResponseRepository> = {},
): UpdateGuestAvailabilityDateResponseRepository => ({
  findGuestLinkToken: vi.fn().mockResolvedValue(TOKEN),
  findStatusFields: vi.fn().mockResolvedValue({
    isPublished: true,
    openUntil: null,
    cancelledAt: null,
  }),
  findCandidateOwner: vi
    .fn()
    .mockResolvedValue({ lobbyId: 'lobby-1', date: '2025-10-01' }),
  isGuestMember: vi.fn().mockResolvedValue(true),
  upsertAnswer: vi.fn().mockResolvedValue(mockAnswer),
  ...overrides,
});

const act = (
  repo: UpdateGuestAvailabilityDateResponseRepository,
  opts: {
    lobbyId?: string;
    dateId?: string;
    token?: string;
    memberId?: string;
  } = {},
) =>
  updateGuestAvailabilityDateResponse(
    repo,
    opts.lobbyId ?? 'lobby-1',
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

  it('募集枠が存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(null),
      findStatusFields: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('募集枠は存在するがゲストリンクトークンが未設定の場合は invalidToken を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findGuestLinkToken: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'invalidToken' });
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

  it('候補日が別募集枠に属する場合は notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findCandidateOwner: vi.fn().mockResolvedValue({
        lobbyId: 'other-lobby',
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
      'lobby-1',
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
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: new Date('2099-01-01'),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('status が scheduling のとき回答できる', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: new Date('2020-01-01'),
        cancelledAt: null,
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'ok', answer: mockAnswer });
  });

  it('status が draft のとき invalidStatus を返す（game-session と異なり 423 ではなく 409 系）', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: false,
        openUntil: null,
        cancelledAt: null,
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });

  it('status が cancelled のとき invalidStatus を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findStatusFields: vi.fn().mockResolvedValue({
        isPublished: true,
        openUntil: null,
        cancelledAt: new Date('2025-01-01'),
      }),
    });

    // Act
    const result = await act(repo);

    // Assert
    expect(result).toEqual({ type: 'invalidStatus' });
  });
});
