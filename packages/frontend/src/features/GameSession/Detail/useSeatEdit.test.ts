import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSeatEdit } from '@/features/GameSession/Detail/useSeatEdit';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { SeatModel } from '@/models/game-session';

vi.mock('@/api/game-session', () => ({ updateSeat: vi.fn() }));
vi.mock('@/stores/auth', () => ({ useAuthStore: vi.fn() }));

const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: mockToastError }),
}));

import { updateSeat } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const LOBBY_ID = 'lobby-1';
const SESSION_ID = 'session-1';

const makeSeat = (
  id: string,
  characterName: string | null = null,
): SeatModel => ({
  id,
  entryId: `entry-${id}`,
  userId: `user-${id}`,
  userName: 'ユーザー',
  guestName: null,
  characterName,
  seatedAt: new Date('2026-08-30T10:00:00.000Z'),
  isGuest: false,
});

const setup = (
  seats: SeatModel[],
  status: GameSessionStatus = GameSessionStatus.scheduled,
  userId: string | null = HOST_USER_ID,
) => {
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: userId ? { id: userId } : null,
  } as unknown as ReturnType<typeof useAuthStore>);
  const onUpdated = vi.fn();
  const composable = useSeatEdit(
    LOBBY_ID,
    SESSION_ID,
    ref(seats),
    ref(status),
    ref(HOST_USER_ID),
    onUpdated,
  );
  return { ...composable, onUpdated };
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('canEditCharacterName', () => {
  it.each([
    GameSessionStatus.scheduled,
    GameSessionStatus.today,
    GameSessionStatus.completed,
  ])('%s のときホストは編集できる（完了後も埋められる）', (status) => {
    // Arrange / Act
    const { canEditCharacterName } = setup([makeSeat('seat-1')], status);

    // Assert
    expect(canEditCharacterName.value).toBe(true);
  });

  it('中止した開催では編集できない', () => {
    // Arrange / Act
    const { canEditCharacterName } = setup(
      [makeSeat('seat-1')],
      GameSessionStatus.cancelled,
    );

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });

  it('ホスト以外は編集できない', () => {
    // Arrange / Act
    const { canEditCharacterName } = setup(
      [makeSeat('seat-1')],
      GameSessionStatus.scheduled,
      'other-user',
    );

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });

  it('一般の着席ユーザーは自分のキャラクター名を編集できる', () => {
    // Arrange / Act
    const { canEditCharacterName, canEditSeat } = setup(
      [makeSeat('self'), makeSeat('other')],
      GameSessionStatus.scheduled,
      'user-self',
    );

    // Assert
    expect(canEditCharacterName.value).toBe(true);
    expect(canEditSeat(makeSeat('self'))).toBe(true);
    expect(canEditSeat(makeSeat('other'))).toBe(false);
  });
});

describe('ドラフト', () => {
  it('startEdit でサーバ値を下書きへコピーする', () => {
    // Arrange
    const { startEdit, draftOf, isEditing } = setup([
      makeSeat('seat-1', 'アルベルト'),
    ]);

    // Act
    startEdit();

    // Assert
    expect(isEditing.value).toBe(true);
    expect(draftOf('seat-1')).toBe('アルベルト');
  });

  it('未割り当ては空文字で初期化する', () => {
    // Arrange
    const { startEdit, draftOf } = setup([makeSeat('seat-1', null)]);

    // Act
    startEdit();

    // Assert
    expect(draftOf('seat-1')).toBe('');
  });

  it('isDirty はサーバ値との差で判定する', () => {
    // Arrange
    const { startEdit, setDraft, isDirty } = setup([
      makeSeat('seat-1', 'アルベルト'),
    ]);
    startEdit();

    // Act / Assert
    expect(isDirty.value).toBe(false);
    setDraft('seat-1', 'ベアトリス');
    expect(isDirty.value).toBe(true);
  });

  it('cancelEdit は編集モードを閉じるだけでサーバ値に触れない', () => {
    // Arrange
    const { startEdit, setDraft, cancelEdit, isEditing } = setup([
      makeSeat('seat-1', 'アルベルト'),
    ]);
    startEdit();
    setDraft('seat-1', '書きかけ');

    // Act
    cancelEdit();

    // Assert
    expect(isEditing.value).toBe(false);
    expect(updateSeat).not.toHaveBeenCalled();
  });
});

describe('submitEdit', () => {
  it('一般参加者は自席の変更だけを送信する', async () => {
    // Arrange
    vi.mocked(updateSeat).mockResolvedValue(makeSeat('self', '自分'));
    const { startEdit, setDraft, submitEdit } = setup(
      [makeSeat('self'), makeSeat('other')],
      GameSessionStatus.scheduled,
      'user-self',
    );
    startEdit();
    setDraft('self', '自分');
    setDraft('other', '他人');

    // Act
    await submitEdit();

    // Assert
    expect(updateSeat).toHaveBeenCalledTimes(1);
    expect(updateSeat).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, 'self', {
      characterName: '自分',
    });
  });

  it('変更のあった席だけを送信する', async () => {
    // Arrange
    const updated = makeSeat('seat-1', 'ベアトリス');
    vi.mocked(updateSeat).mockResolvedValue(updated);
    const { startEdit, setDraft, submitEdit, onUpdated } = setup([
      makeSeat('seat-1', 'アルベルト'),
      makeSeat('seat-2', 'カミーユ'),
    ]);
    startEdit();
    setDraft('seat-1', 'ベアトリス');

    // Act
    await submitEdit();

    // Assert
    expect(updateSeat).toHaveBeenCalledTimes(1);
    expect(updateSeat).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, 'seat-1', {
      characterName: 'ベアトリス',
    });
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });

  it('空欄にすると null（解除）を送る', async () => {
    // Arrange
    vi.mocked(updateSeat).mockResolvedValue(makeSeat('seat-1', null));
    const { startEdit, setDraft, submitEdit } = setup([
      makeSeat('seat-1', 'アルベルト'),
    ]);
    startEdit();
    setDraft('seat-1', '');

    // Act
    await submitEdit();

    // Assert
    expect(updateSeat).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, 'seat-1', {
      characterName: null,
    });
  });

  it('変更が無ければ API を呼ばず編集モードを閉じる', async () => {
    // Arrange
    const { startEdit, submitEdit, isEditing } = setup([
      makeSeat('seat-1', 'アルベルト'),
    ]);
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(updateSeat).not.toHaveBeenCalled();
    expect(isEditing.value).toBe(false);
  });

  it('失敗すると編集モードを維持したまま toast.error を出す', async () => {
    // Arrange
    vi.mocked(updateSeat).mockRejectedValue(new Error('boom'));
    const { startEdit, setDraft, submitEdit, isEditing } = setup([
      makeSeat('seat-1', 'アルベルト'),
    ]);
    startEdit();
    setDraft('seat-1', 'ベアトリス');

    // Act
    await submitEdit();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith(
      'キャラクター名の更新に失敗しました',
    );
    expect(isEditing.value).toBe(true);
  });
});
