import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfirmFlow } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { LobbyDetailModel } from '@/models/lobby';

vi.mock('@/api/game-session', () => ({ createGameSession: vi.fn() }));
vi.mock('@/api/lobby', () => ({ getSchedulePoll: vi.fn() }));
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { createGameSession } from '@/api/game-session';
import { getSchedulePoll } from '@/api/lobby';

const lobby = {
  id: 'lobby-1',
  maxPlayers: 2,
  activeEntries: [
    { id: 'entry-ok', userId: 'user-1', userName: 'Alice', guestName: null },
    { id: 'entry-maybe', userId: 'user-2', userName: 'Bob', guestName: null },
    { id: 'entry-ng', userId: null, userName: null, guestName: 'Carol' },
  ],
  schedulePolls: [{ id: 'poll-1' }],
} as unknown as LobbyDetailModel;

const poll = {
  id: 'poll-1',
  lobbyId: 'lobby-1',
  candidateDates: [
    {
      id: 'candidate-1',
      date: '2026-09-20',
      timeLabel: '19:00〜',
      answersByEntryId: new Map([
        ['entry-ok', { answer: 'ok' }],
        ['entry-maybe', { answer: 'maybe' }],
        ['entry-ng', { answer: 'ng' }],
      ]),
    },
  ],
} as Awaited<ReturnType<typeof getSchedulePoll>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSchedulePoll).mockResolvedValue(poll);
});

describe('useConfirmFlow', () => {
  it('候補日を選ぶと ok / maybe の在籍 entry を既定で選ぶ', async () => {
    // Arrange
    const flow = useConfirmFlow(() => lobby, vi.fn());
    await flow.reset();

    // Act
    flow.selectCandidate('candidate-1');

    // Assert
    expect(flow.scheduledAt.value).toBe('2026-09-20');
    expect([...flow.selectedEntryIds.value]).toEqual([
      'entry-ok',
      'entry-maybe',
    ]);
    expect(flow.isWarnedEntry('entry-ng')).toBe(true);
  });

  it('候補日が未選択のあいだは次のステップへ進めない', async () => {
    // Arrange
    const flow = useConfirmFlow(() => lobby, vi.fn());
    await flow.reset();

    // Act
    const beforeSelect = flow.canProceedCandidate.value;
    flow.selectCandidate('candidate-1');

    // Assert
    expect(beforeSelect).toBe(false);
    expect(flow.canProceedCandidate.value).toBe(true);
  });

  it('開催日は選択した候補日から導出する', async () => {
    // Arrange
    const flow = useConfirmFlow(() => lobby, vi.fn());
    await flow.reset();
    flow.selectCandidate('candidate-1');

    // Act
    await flow.reset();

    // Assert
    expect(flow.selectedCandidateId.value).toBeNull();
    expect(flow.scheduledAt.value).toBe('');
  });

  it('空欄の上書き項目を省略して createGameSession を呼ぶ', async () => {
    // Arrange
    const onCreated = vi.fn();
    const flow = useConfirmFlow(() => lobby, onCreated);
    await flow.reset();
    flow.selectCandidate('candidate-1');
    vi.mocked(createGameSession).mockResolvedValue({
      id: 'session-1',
    } as never);

    // Act
    await flow.confirm();

    // Assert
    expect(createGameSession).toHaveBeenCalledWith('lobby-1', {
      scheduledAt: '2026-09-20',
      entryIds: ['entry-ok', 'entry-maybe'],
    });
    expect(onCreated).toHaveBeenCalledTimes(1);
  });
});
