import { describe, expect, it, vi } from 'vitest';
import { getSchedulePoll } from '@/lobby/application/get-schedule-poll';
import type { GetSchedulePollRepository } from '@/lobby/application/get-schedule-poll';
import type { LobbySchedulePoll } from '@taku-biyori/shared';

const mockPoll: LobbySchedulePoll = {
  id: 'poll-1',
  lobbyId: 'lobby-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  candidateDates: [
    {
      id: 'date-1',
      date: '2026-08-10',
      timeLabel: null,
      answers: [
        { id: 'answer-1', entryId: 'entry-left', answer: 'ok', comment: null },
      ],
    },
  ],
};

const makeRepo = (
  overrides: Partial<GetSchedulePollRepository> = {},
): GetSchedulePollRepository => ({
  findLobbyVisibility: vi.fn().mockResolvedValue({
    publishedAt: new Date('2026-08-01T00:00:00.000Z'),
    hostUserId: 'user-1',
  }),
  findSchedulePollWithAnswers: vi.fn().mockResolvedValue(mockPoll),
  ...overrides,
});

describe('getSchedulePoll', () => {
  it('日程調整を回答つきで返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await getSchedulePoll(repo, 'lobby-1', 'poll-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', poll: mockPoll });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await getSchedulePoll(
      repo,
      'nonexistent',
      'poll-1',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('非公開募集枠にホスト以外がアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await getSchedulePoll(repo, 'lobby-1', 'poll-1', 'user-2');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開募集枠でもホスト本人は閲覧できる', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ publishedAt: null, hostUserId: 'user-1' }),
    });

    // Act
    const result = await getSchedulePoll(repo, 'lobby-1', 'poll-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', poll: mockPoll });
  });

  it('存在しない調整IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollWithAnswers: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await getSchedulePoll(
      repo,
      'lobby-1',
      'nonexistent',
      'user-1',
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('調整が別のロビーに属する場合は notFound を返す（他ロビーの ID の存在を漏らさない）', async () => {
    // Arrange
    const repo = makeRepo({
      findSchedulePollWithAnswers: vi.fn().mockResolvedValue({
        ...mockPoll,
        lobbyId: 'other-lobby',
      }),
    });

    // Act
    const result = await getSchedulePoll(repo, 'lobby-1', 'poll-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('脱退済みメンバーの回答も含めて返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await getSchedulePoll(repo, 'lobby-1', 'poll-1', 'user-1');

    // Assert
    expect(result).toEqual({
      type: 'ok',
      poll: expect.objectContaining({
        candidateDates: [
          expect.objectContaining({
            answers: [
              {
                id: 'answer-1',
                entryId: 'entry-left',
                answer: 'ok',
                comment: null,
              },
            ],
          }),
        ],
      }),
    });
  });
});
