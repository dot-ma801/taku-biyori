import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GUEST_TOKEN_HEADER } from '@taku-biyori/shared';
import {
  createSchedulePoll,
  getSchedulePoll,
  joinLobby,
  joinLobbyAsGuest,
  leaveLobby,
  listSchedulePolls,
  replaceCandidateDates,
  upsertGuestScheduleAnswers,
  upsertScheduleAnswers,
} from '@/api/lobby';
import { apiRequest } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({ apiRequest: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);

const entryDto = {
  id: 'entry-1',
  userId: 'user-1',
  userName: 'あさひ',
  guestName: null,
  joinedAt: '2026-08-01T00:00:00.000Z',
  leftAt: null,
};

/**
 * 参加系エンドポイントのパスを固定する。
 *
 * バックエンドのルートを `/members` から `/entries` へ改名したとき、
 * ここが追随できていないと参加・脱退が 404 になる。composable のテストは
 * この層をモックするため気づけない（issue #113 のレビュー指摘）。
 */
describe('lobby api — 参加系のパス', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue(entryDto);
  });

  it('joinLobby は POST /api/lobbies/:id/entries を呼ぶ', async () => {
    // Arrange / Act
    await joinLobby('lobby-1', {});

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/entries',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('leaveLobby は DELETE /api/lobbies/:id/entries/:entryId を呼ぶ', async () => {
    // Arrange / Act
    await leaveLobby('lobby-1', 'entry-1');

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/entries/entry-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('joinLobbyAsGuest は POST /api/lobbies/:id/guest-entries をトークン付きで呼ぶ', async () => {
    // Arrange / Act
    await joinLobbyAsGuest('lobby-1', 'token-1', { guestName: 'そら' });

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/guest-entries',
      expect.objectContaining({
        method: 'POST',
        headers: { [GUEST_TOKEN_HEADER]: 'token-1' },
      }),
    );
  });
});

const candidateDateDto = {
  id: 'date-1',
  date: '2026-09-05',
  timeLabel: '19:00〜',
  answers: [
    {
      id: 'answer-1',
      entryId: 'entry-1',
      answer: 'ok' as const,
      comment: null,
    },
  ],
};

const schedulePollDto = {
  id: 'poll-1',
  lobbyId: 'lobby-1',
  createdAt: '2026-08-20T00:00:00.000Z',
  candidateDates: [candidateDateDto],
};

const answerDto = {
  id: 'answer-1',
  entryId: 'entry-1',
  answer: 'ok' as const,
  comment: null,
};

/**
 * 日程調整（SchedulePoll）系エンドポイントのパスと、DTO → model 変換を確認する。
 * composable はこの層をモックするため、パスや変換に誤りがあってもここでしか気づけない。
 */
describe('lobby api — 日程調整系', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('listSchedulePolls は GET /api/lobbies/:id/schedule-polls を呼び、model の配列を返す', async () => {
    // Arrange
    apiRequestMock.mockResolvedValue([
      { id: 'poll-1', createdAt: '2026-08-20T00:00:00.000Z' },
    ]);

    // Act
    const result = await listSchedulePolls('lobby-1');

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/schedule-polls',
    );
    expect(result).toEqual([
      { id: 'poll-1', createdAt: new Date('2026-08-20T00:00:00.000Z') },
    ]);
  });

  it('createSchedulePoll は POST /api/lobbies/:id/schedule-polls を呼び、model を返す', async () => {
    // Arrange
    apiRequestMock.mockResolvedValue(schedulePollDto);
    const input = { candidateDates: [{ date: '2026-09-05' }] };

    // Act
    const result = await createSchedulePoll('lobby-1', input);

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/schedule-polls',
      expect.objectContaining({ method: 'POST', body: input }),
    );
    expect(result.id).toBe('poll-1');
    expect(result.candidateDates[0]?.answersByEntryId.get('entry-1')).toEqual({
      id: 'answer-1',
      entryId: 'entry-1',
      answer: 'ok',
      comment: null,
    });
  });

  it('getSchedulePoll は GET /api/lobbies/:id/schedule-polls/:pollId を呼び、model を返す', async () => {
    // Arrange
    apiRequestMock.mockResolvedValue(schedulePollDto);

    // Act
    const result = await getSchedulePoll('lobby-1', 'poll-1');

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/schedule-polls/poll-1',
    );
    expect(result.lobbyId).toBe('lobby-1');
  });

  it('replaceCandidateDates は PUT .../candidate-dates を呼び、回答なしの model 配列を返す', async () => {
    // Arrange
    apiRequestMock.mockResolvedValue([
      { id: 'date-1', date: '2026-09-05', timeLabel: null },
    ]);
    const input = { candidateDates: [{ date: '2026-09-05' }] };

    // Act
    const result = await replaceCandidateDates('lobby-1', 'poll-1', input);

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/candidate-dates',
      expect.objectContaining({ method: 'PUT', body: input }),
    );
    expect(result[0]?.answersByEntryId.size).toBe(0);
  });

  it('upsertScheduleAnswers は PATCH .../answers を呼び、model の配列を返す', async () => {
    // Arrange
    apiRequestMock.mockResolvedValue([answerDto]);
    const input = {
      answers: [{ candidateDateId: 'date-1', answer: 'ok' as const }],
    };

    // Act
    const result = await upsertScheduleAnswers('lobby-1', 'poll-1', input);

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/answers',
      expect.objectContaining({ method: 'PATCH', body: input }),
    );
    expect(result).toEqual([
      { id: 'answer-1', entryId: 'entry-1', answer: 'ok', comment: null },
    ]);
  });

  it('upsertGuestScheduleAnswers は PATCH .../guest-answers をトークン付きで呼ぶ', async () => {
    // Arrange
    apiRequestMock.mockResolvedValue([answerDto]);
    const input = {
      answers: [{ candidateDateId: 'date-1', answer: 'ok' as const }],
      entryId: 'entry-1',
    };

    // Act
    const result = await upsertGuestScheduleAnswers(
      'lobby-1',
      'poll-1',
      'token-1',
      input,
    );

    // Assert
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/lobbies/lobby-1/schedule-polls/poll-1/guest-answers',
      expect.objectContaining({
        method: 'PATCH',
        body: input,
        headers: { [GUEST_TOKEN_HEADER]: 'token-1' },
      }),
    );
    expect(result).toHaveLength(1);
  });
});
