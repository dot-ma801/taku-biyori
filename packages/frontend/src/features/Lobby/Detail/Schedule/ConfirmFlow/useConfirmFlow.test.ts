import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useConfirmFlow } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { LobbyDetailModel } from '@/models/lobby';

vi.mock('@/api/game-session', () => ({ createGameSession: vi.fn() }));
vi.mock('@/api/lobby', () => ({
  getSchedulePoll: vi.fn(),
  updateLobbyStatus: vi.fn(),
}));
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { createGameSession } from '@/api/game-session';
import { getSchedulePoll, updateLobbyStatus } from '@/api/lobby';

const lobby = {
  id: 'lobby-1',
  maxPlayers: 2,
  status: 'closed',
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

  // 開催日は候補日からしか選べない。候補日が1件も無いロビーでは確定そのものができない
  it('候補日が1件も無いロビーでは確定へ進めない', async () => {
    // Arrange
    const lobbyWithoutPoll = {
      ...lobby,
      schedulePolls: [],
    } as unknown as LobbyDetailModel;
    const flow = useConfirmFlow(
      () => lobbyWithoutPoll,
      () => false,
      vi.fn(),
    );

    // Act
    await flow.reset();

    // Assert
    expect(getSchedulePoll).not.toHaveBeenCalled();
    expect(flow.candidateOptions.value).toEqual([]);
    expect(flow.canProceedCandidate.value).toBe(false);
  });

  describe('ステップの進退', () => {
    it('候補日と参加者が決まるとステップを進められる', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();

      // Act
      flow.goNext();
      const blockedAtStep1 = flow.step.value;
      flow.selectCandidate('candidate-1');
      flow.goNext();
      flow.goNext();

      // Assert
      expect(blockedAtStep1).toBe(1);
      expect(flow.step.value).toBe(3);
    });

    it('戻るとひとつ前のステップに戻る', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.selectCandidate('candidate-1');
      flow.goNext();

      // Act
      flow.goBack();

      // Assert
      expect(flow.step.value).toBe(1);
    });
  });

  describe('確定後の受付', () => {
    it('受付中のロビーは確定と同時に受付を閉じる', async () => {
      // Arrange
      const openLobby = { ...lobby, status: 'open' } as LobbyDetailModel;
      const flow = useConfirmFlow(
        () => openLobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.selectCandidate('candidate-1');
      vi.mocked(createGameSession).mockResolvedValue({
        id: 'session-1',
      } as never);

      // Act
      await flow.confirm();

      // Assert
      expect(updateLobbyStatus).toHaveBeenCalledWith('lobby-1', {
        status: 'closed',
      });
    });

    it('すでに受付を閉じているロビーでは status を触らない', async () => {
      // Arrange
      const flow = useConfirmFlow(
        () => lobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.selectCandidate('candidate-1');
      vi.mocked(createGameSession).mockResolvedValue({
        id: 'session-1',
      } as never);

      // Act
      await flow.confirm();

      // Assert
      expect(updateLobbyStatus).not.toHaveBeenCalled();
    });

    // 受付を閉じられなくても確定そのものは成立している（ホストは手動で閉じられる）
    it('受付を閉じられなくても作成の通知は行う', async () => {
      // Arrange
      const openLobby = { ...lobby, status: 'open' } as LobbyDetailModel;
      const onCreated = vi.fn();
      const flow = useConfirmFlow(
        () => openLobby,
        () => false,
        onCreated,
      );
      await flow.reset();
      flow.selectCandidate('candidate-1');
      vi.mocked(createGameSession).mockResolvedValue({
        id: 'session-1',
      } as never);
      vi.mocked(updateLobbyStatus).mockRejectedValue(new Error('failed'));

      // Act
      await flow.confirm();

      // Assert
      expect(onCreated).toHaveBeenCalledTimes(1);
    });
  });

  // API の契約（CreateGameSessionInputSchema の timeLabel: max 20）を送信前に守る。
  // 超えたまま送ると 400 になり、画面には汎用の失敗メッセージしか出せない
  describe('ひとことの文字数', () => {
    const prepare = async () => {
      const flow = useConfirmFlow(
        () => lobby,
        () => false,
        vi.fn(),
      );
      await flow.reset();
      flow.selectCandidate('candidate-1');
      return flow;
    };

    it('20文字を超えると確定できない', async () => {
      // Arrange
      const flow = await prepare();

      // Act
      flow.draft.value = { ...flow.draft.value, timeLabel: 'あ'.repeat(21) };

      // Assert
      expect(flow.canConfirm.value).toBe(false);
      expect(flow.timeLabelCounter.value).toEqual({
        label: '21 / 20',
        isOver: true,
      });
    });

    it('20文字までなら確定できる', async () => {
      // Arrange
      const flow = await prepare();

      // Act
      flow.draft.value = { ...flow.draft.value, timeLabel: 'あ'.repeat(20) };

      // Assert
      expect(flow.canConfirm.value).toBe(true);
    });

    it('超過中は confirm を呼んでも送信しない', async () => {
      // Arrange
      const flow = await prepare();
      flow.draft.value = { ...flow.draft.value, timeLabel: 'あ'.repeat(21) };

      // Act
      await flow.confirm();

      // Assert
      expect(createGameSession).not.toHaveBeenCalled();
    });

    // 検証は正規化後の長さで数えているので、送る値も正規化後で揃える。
    // 生値のまま送ると前後の空白ぶんだけ契約を超えうる
    it('正規化したひとことを送る', async () => {
      // Arrange
      const flow = await prepare();
      flow.draft.value = { ...flow.draft.value, timeLabel: '  19:00〜  ' };
      vi.mocked(createGameSession).mockResolvedValue({
        id: 'session-1',
      } as never);

      // Act
      await flow.confirm();

      // Assert
      expect(createGameSession).toHaveBeenCalledWith(
        'lobby-1',
        expect.objectContaining({ timeLabel: '19:00〜' }),
      );
    });
  });

  it('開催日を表示用に整形して返す', async () => {
    // Arrange
    const flow = useConfirmFlow(
      () => lobby,
      () => false,
      vi.fn(),
    );
    await flow.reset();

    // Act
    const beforeSelect = flow.scheduledAtLabel.value;
    flow.selectCandidate('candidate-1');

    // Assert
    expect(beforeSelect).toBe('');
    expect(flow.scheduledAtLabel.value).toBe('9/20（日）');
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
