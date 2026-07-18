import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConfirmFlow } from '@/features/Lobby/Detail/Schedule/ConfirmFlow/useConfirmFlow';
import type { LobbyAvailabilityDate, LobbyMember } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  confirmLobby: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ success: vi.fn(), error: vi.fn() })),
}));

import { confirmLobby } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';

const members: LobbyMember[] = [
  { id: 'member-1', userId: 'user-1', userName: 'Alice', guestName: null, joinedAt: '2025-01-01T00:00:00Z' },
  { id: 'member-2', userId: 'user-2', userName: 'Bob', guestName: null, joinedAt: '2025-01-01T00:00:00Z' },
  { id: 'member-3', userId: null, userName: null, guestName: 'Guest', joinedAt: '2025-01-01T00:00:00Z' },
];

const dates: LobbyAvailabilityDate[] = [
  {
    id: 'date-1',
    date: '2025-09-01',
    answers: [
      { id: 'ans-1', memberId: 'member-1', answer: 'ok', comment: null },
      { id: 'ans-2', memberId: 'member-2', answer: 'maybe', comment: null },
      { id: 'ans-3', memberId: 'member-3', answer: 'ng', comment: null },
    ],
  },
  {
    id: 'date-2',
    date: '2025-09-08',
    answers: [
      { id: 'ans-4', memberId: 'member-1', answer: 'ok', comment: null },
    ],
  },
];

const onConflict = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('candidateOptions', () => {
  it('各候補日の ok/maybe/ng 件数を含む配列を返す', () => {
    // Arrange
    const { candidateOptions } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);

    // Act & Assert
    expect(candidateOptions.value).toEqual([
      { id: 'date-1', date: '2025-09-01', counts: { ok: 1, maybe: 1, ng: 1 } },
      { id: 'date-2', date: '2025-09-08', counts: { ok: 1, maybe: 0, ng: 0 } },
    ]);
  });
});

describe('canProceedCandidate', () => {
  it('候補日を選択していないとき false を返す', () => {
    const { canProceedCandidate } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    expect(canProceedCandidate.value).toBe(false);
  });

  it('候補日を選択したとき true を返す', () => {
    const { canProceedCandidate, selectCandidate } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');
    expect(canProceedCandidate.value).toBe(true);
  });
});

describe('selectCandidate', () => {
  it('ok/maybe 回答者をデフォルト選択する', () => {
    // Arrange
    const { selectCandidate, selectedMemberIds } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);

    // Act
    selectCandidate('date-1');

    // Assert: member-1 (ok) と member-2 (maybe) が選択される
    expect(selectedMemberIds.value.has('member-1')).toBe(true);
    expect(selectedMemberIds.value.has('member-2')).toBe(true);
    expect(selectedMemberIds.value.has('member-3')).toBe(false);
  });

  it('候補日を変更するとデフォルト選択がリセットされる', () => {
    // Arrange
    const { selectCandidate, selectedMemberIds } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');
    expect(selectedMemberIds.value.has('member-2')).toBe(true);

    // Act: date-2 に変更（member-2 は未回答）
    selectCandidate('date-2');

    // Assert: member-1 のみ選択（date-2 で ok 回答）
    expect(selectedMemberIds.value.has('member-1')).toBe(true);
    expect(selectedMemberIds.value.has('member-2')).toBe(false);
  });
});

describe('toggleMember', () => {
  it('未選択メンバーを選択状態にする', () => {
    // Arrange
    const { selectCandidate, toggleMember, selectedMemberIds } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');

    // Act
    toggleMember('member-3');

    // Assert
    expect(selectedMemberIds.value.has('member-3')).toBe(true);
  });

  it('選択済みメンバーを未選択状態にする', () => {
    // Arrange
    const { selectCandidate, toggleMember, selectedMemberIds } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');
    expect(selectedMemberIds.value.has('member-1')).toBe(true);

    // Act
    toggleMember('member-1');

    // Assert
    expect(selectedMemberIds.value.has('member-1')).toBe(false);
  });
});

describe('canProceedMembers', () => {
  it('選択メンバーが 0 人のとき false を返す', () => {
    // Arrange
    const { selectCandidate, toggleMember, canProceedMembers } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-2'); // member-1 のみデフォルト選択
    toggleMember('member-1'); // 全員解除

    // Assert
    expect(canProceedMembers.value).toBe(false);
  });

  it('1 人以上選択されていれば true を返す', () => {
    // Arrange
    const { selectCandidate, canProceedMembers } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');

    // Assert
    expect(canProceedMembers.value).toBe(true);
  });
});

describe('capacityMismatch', () => {
  it('maxPlayers が null なら false を返す', () => {
    // Arrange
    const { selectCandidate, capacityMismatch } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1'); // 2人選択

    // Assert
    expect(capacityMismatch.value).toBe(false);
  });

  it('選択数と maxPlayers が一致するとき false を返す', () => {
    // Arrange
    const { selectCandidate, capacityMismatch } = useConfirmFlow(LOBBY_ID, members, dates, 2, onConflict);
    selectCandidate('date-1'); // member-1, member-2 の 2人選択

    // Assert
    expect(capacityMismatch.value).toBe(false);
  });

  it('選択数と maxPlayers が不一致のとき true を返す', () => {
    // Arrange
    const { selectCandidate, capacityMismatch } = useConfirmFlow(LOBBY_ID, members, dates, 3, onConflict);
    selectCandidate('date-1'); // 2人選択、定員は3

    // Assert
    expect(capacityMismatch.value).toBe(true);
  });
});

describe('isWarnedMember', () => {
  it('選択中候補日の回答が ng のメンバーは true を返す', () => {
    // Arrange
    const { selectCandidate, isWarnedMember } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');

    // Assert: member-3 は ng
    expect(isWarnedMember('member-3')).toBe(true);
  });

  it('選択中候補日に未回答のメンバーは true を返す', () => {
    // Arrange
    const { selectCandidate, isWarnedMember } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-2'); // member-2 は date-2 に未回答

    // Assert
    expect(isWarnedMember('member-2')).toBe(true);
  });

  it('ok/maybe 回答者は false を返す', () => {
    // Arrange
    const { selectCandidate, isWarnedMember } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');

    // Assert
    expect(isWarnedMember('member-1')).toBe(false); // ok
    expect(isWarnedMember('member-2')).toBe(false); // maybe
  });
});

describe('step management', () => {
  it('初期ステップは 1', () => {
    const { step } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    expect(step.value).toBe(1);
  });

  it('goNext でステップが進む', () => {
    const { step, goNext, selectCandidate } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');
    goNext();
    expect(step.value).toBe(2);
    goNext();
    expect(step.value).toBe(3);
  });

  it('goBack でステップが戻る', () => {
    const { step, goNext, goBack, selectCandidate } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');
    goNext();
    goBack();
    expect(step.value).toBe(1);
  });

  it('reset でステップ 1 に戻る', () => {
    const { step, goNext, reset, selectCandidate } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');
    goNext();
    reset();
    expect(step.value).toBe(1);
  });
});

describe('confirm', () => {
  it('API を呼び出す', async () => {
    // Arrange
    vi.mocked(confirmLobby).mockResolvedValue({ id: 'gs-1' } as never);
    const { selectCandidate, confirm } = useConfirmFlow(LOBBY_ID, members, dates, null, onConflict);
    selectCandidate('date-1');

    // Act
    await confirm();

    // Assert
    expect(confirmLobby).toHaveBeenCalledWith(LOBBY_ID, {
      candidateId: 'date-1',
      memberIds: expect.arrayContaining(['member-1', 'member-2']),
    });
  });
});
