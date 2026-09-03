import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
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
  it('ダイアログが開いたら最新の候補日を読み込む', async () => {
    // Arrange
    const isOpen = ref(false);
    const flow = useConfirmFlow(() => lobby, isOpen, vi.fn());

    // Act
    isOpen.value = true;

    // Assert
    await vi.waitFor(() => {
      expect(getSchedulePoll).toHaveBeenCalledWith('lobby-1', 'poll-1');
      expect(flow.candidateOptions.value).toHaveLength(1);
    });
  });

  it('候補日を選ぶと ok / maybe の在籍 entry を既定で選ぶ', async () => {
    // Arrange
    const flow = useConfirmFlow(
      () => lobby,
      () => false,
      vi.fn(),
    );
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
    const flow = useConfirmFlow(
      () => lobby,
      () => false,
      vi.fn(),
    );
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
    const flow = useConfirmFlow(
      () => lobby,
      () => false,
      vi.fn(),
    );
    await flow.reset();
    flow.selectCandidate('candidate-1');

    // Act
    await flow.reset();

    // Assert
    expect(flow.selectedCandidateId.value).toBeNull();
    expect(flow.scheduledAt.value).toBe('');
  });

  // 候補日の無いロビー（日程調整を回していない・直接卓立て）でも開催を作れる必要がある
  // （design-v2 §7 ステップ1「候補日から選ぶ / 直接日付を入れる の2経路」）
  describe('直接日付を入れる経路', () => {
    const lobbyWithoutPoll = {
      ...lobby,
      schedulePolls: [],
    } as unknown as LobbyDetailModel;

    it('候補日が1件も無いロビーでは直接入力に切り替わる', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobbyWithoutPoll,
        () => false,
        vi.fn(),
      );

      // Act
      await flow.reset();

      // Assert
      expect(flow.dateMode.value).toBe('direct');
      expect(getSchedulePoll).not.toHaveBeenCalled();
    });

    it('直接入力した日付が開催日になり次へ進める', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobbyWithoutPoll,
        () => false,
        vi.fn(),
      );
      await flow.reset();

      // Act
      flow.setDirectDate('2026-10-05');

      // Assert
      expect(flow.scheduledAt.value).toBe('2026-10-05');
      expect(flow.canProceedCandidate.value).toBe(true);
    });

    // 直接日付には回答が無いので、ok / maybe で絞り込む既定値が作れない
    it('直接入力では在籍している entry を既定で全員選ぶ', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobbyWithoutPoll,
        () => false,
        vi.fn(),
      );
      await flow.reset();

      // Act
      flow.setDirectDate('2026-10-05');

      // Assert
      expect([...flow.selectedEntryIds.value]).toEqual([
        'entry-ok',
        'entry-maybe',
        'entry-ng',
      ]);
      expect(flow.isWarnedEntry('entry-ng')).toBe(false);
      expect(flow.getEntryAnswer('entry-ok')).toBeNull();
    });

    it('候補日があるロビーでも直接入力へ切り替えられる', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.selectCandidate('candidate-1');

      // Act
      flow.setDateMode('direct');

      // Assert: 候補日側の選択は持ち越さない
      expect(flow.selectedCandidateId.value).toBeNull();
      expect(flow.scheduledAt.value).toBe('');
      expect(flow.canProceedCandidate.value).toBe(false);
    });

    it('直接入力から候補日選択へ戻すと入力した日付を捨てる', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.setDateMode('direct');
      flow.setDirectDate('2026-10-05');

      // Act
      flow.setDateMode('candidate');

      // Assert
      expect(flow.scheduledAt.value).toBe('');
      expect([...flow.selectedEntryIds.value]).toEqual([]);
    });

    it('直接入力した日付で createGameSession を呼ぶ', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobbyWithoutPoll,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.setDirectDate('2026-10-05');
      vi.mocked(createGameSession).mockResolvedValue({
        id: 'session-1',
      } as never);

      // Act
      await flow.confirm();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith('lobby-1', {
        scheduledAt: '2026-10-05',
        entryIds: ['entry-ok', 'entry-maybe', 'entry-ng'],
      });
    });
  });

  it('空欄の上書き項目を省略して createGameSession を呼ぶ', async () => {
    // Arrange
    const onCreated = vi.fn();
    const flow = useConfirmFlow(
      () => lobby,
      () => false,
      onCreated,
    );
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
