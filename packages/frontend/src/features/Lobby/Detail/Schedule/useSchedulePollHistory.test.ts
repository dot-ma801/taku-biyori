import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSchedulePollHistory } from '@/features/Lobby/Detail/Schedule/useSchedulePollHistory';
import type { SchedulePollModel } from '@/models/schedule-poll';

vi.mock('@/api/lobby', () => ({
  getSchedulePoll: vi.fn(),
}));

import { getSchedulePoll } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const POLL_ID_1 = 'poll-1';
const POLL_ID_2 = 'poll-2';

function makePoll(id: string): SchedulePollModel {
  return {
    id,
    lobbyId: LOBBY_ID,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    candidateDates: [
      {
        id: 'date-1',
        date: '2026-07-10',
        timeLabel: null,
        answersByEntryId: new Map(),
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ensureLoaded', () => {
  it('未取得の poll を取得する', async () => {
    // Arrange
    vi.mocked(getSchedulePoll).mockResolvedValue(makePoll(POLL_ID_1));
    const { ensureLoaded, candidateDatesOf } = useSchedulePollHistory(LOBBY_ID);

    // Act
    await ensureLoaded(POLL_ID_1);

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledWith(LOBBY_ID, POLL_ID_1);
    expect(candidateDatesOf(POLL_ID_1)).toEqual(
      makePoll(POLL_ID_1).candidateDates,
    );
  });

  it('一度取得した poll は再取得しない（キャッシュする）', async () => {
    // Arrange
    vi.mocked(getSchedulePoll).mockResolvedValue(makePoll(POLL_ID_1));
    const { ensureLoaded } = useSchedulePollHistory(LOBBY_ID);
    await ensureLoaded(POLL_ID_1);
    vi.mocked(getSchedulePoll).mockClear();

    // Act
    await ensureLoaded(POLL_ID_1);

    // Assert
    expect(getSchedulePoll).not.toHaveBeenCalled();
  });

  it('別の poll id は独立して取得する', async () => {
    // Arrange
    vi.mocked(getSchedulePoll).mockImplementation((_lobbyId, pollId) =>
      Promise.resolve(makePoll(pollId)),
    );
    const { ensureLoaded, candidateDatesOf } = useSchedulePollHistory(LOBBY_ID);

    // Act
    await ensureLoaded(POLL_ID_1);
    await ensureLoaded(POLL_ID_2);

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledTimes(2);
    expect(candidateDatesOf(POLL_ID_1)).toEqual(
      makePoll(POLL_ID_1).candidateDates,
    );
    expect(candidateDatesOf(POLL_ID_2)).toEqual(
      makePoll(POLL_ID_2).candidateDates,
    );
  });

  it('同時に呼ばれても1回しか取得しない', async () => {
    // Arrange
    let resolve!: (v: SchedulePollModel) => void;
    vi.mocked(getSchedulePoll).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { ensureLoaded } = useSchedulePollHistory(LOBBY_ID);

    // Act
    const first = ensureLoaded(POLL_ID_1);
    const second = ensureLoaded(POLL_ID_1);
    resolve(makePoll(POLL_ID_1));
    await Promise.all([first, second]);

    // Assert
    expect(getSchedulePoll).toHaveBeenCalledTimes(1);
  });

  it('取得に失敗したとき errorMessageOf を設定する', async () => {
    // Arrange
    vi.mocked(getSchedulePoll).mockRejectedValue(new Error('ng'));
    const { ensureLoaded, errorMessageOf, candidateDatesOf } =
      useSchedulePollHistory(LOBBY_ID);

    // Act
    await ensureLoaded(POLL_ID_1);

    // Assert
    expect(errorMessageOf(POLL_ID_1)).toBe('日程調整の取得に失敗しました');
    expect(candidateDatesOf(POLL_ID_1)).toEqual([]);
  });
});

describe('isLoading', () => {
  it('取得中は true を返す', async () => {
    // Arrange
    let resolve!: (v: SchedulePollModel) => void;
    vi.mocked(getSchedulePoll).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { ensureLoaded, isLoading } = useSchedulePollHistory(LOBBY_ID);

    // Act
    const promise = ensureLoaded(POLL_ID_1);

    // Assert
    expect(isLoading(POLL_ID_1)).toBe(true);
    resolve(makePoll(POLL_ID_1));
    await promise;
    expect(isLoading(POLL_ID_1)).toBe(false);
  });

  it('取得前は false を返す', () => {
    // Arrange
    const { isLoading } = useSchedulePollHistory(LOBBY_ID);

    // Assert
    expect(isLoading(POLL_ID_1)).toBe(false);
  });
});

describe('candidateDatesOf', () => {
  it('未取得の poll は空配列を返す', () => {
    // Arrange
    const { candidateDatesOf } = useSchedulePollHistory(LOBBY_ID);

    // Assert
    expect(candidateDatesOf(POLL_ID_1)).toEqual([]);
  });
});
