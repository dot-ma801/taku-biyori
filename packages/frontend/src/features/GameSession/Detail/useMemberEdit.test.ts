import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useMemberEdit } from '@/features/GameSession/Detail/useMemberEdit';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { GameSessionMember } from '@taku-biyori/shared';

vi.mock('@/api/game-session', () => ({
  updateMember: vi.fn(),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(() => ({ error: vi.fn() })),
}));

import { updateMember } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const SESSION_ID = 'session-1';
const USER_ID = 'user-1';
const MEMBER_ID = 'member-1';
const CHARACTER_NAME = 'アリス';

function makeMember(
  overrides: Partial<GameSessionMember> = {},
): GameSessionMember {
  return {
    id: MEMBER_ID,
    userId: USER_ID,
    userName: 'テストユーザー',
    guestName: null,
    characterName: CHARACTER_NAME,
    joinedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: USER_ID },
  } as ReturnType<typeof useAuthStore>);
  vi.mocked(useToast).mockReturnValue({
    error: vi.fn(),
  } as unknown as ReturnType<typeof useToast>);
});

describe('myMember', () => {
  it('ログインユーザーのメンバー情報を返す', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([makeMember()]);

    // Act
    const { myMember } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );

    // Assert
    expect(myMember.value?.id).toBe(MEMBER_ID);
  });

  it('メンバーでない場合は undefined を返す', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([]);

    // Act
    const { myMember } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );

    // Assert
    expect(myMember.value).toBeUndefined();
  });
});

describe('canEditCharacterName', () => {
  it.each([
    GameSessionStatus.open,
    GameSessionStatus.scheduling,
    GameSessionStatus.confirmed,
    GameSessionStatus.today,
  ])('メンバーかつ %s ステータスのとき true', (status) => {
    // Arrange
    const members = ref<GameSessionMember[]>([makeMember()]);

    // Act
    const { canEditCharacterName } = useMemberEdit(
      SESSION_ID,
      members,
      () => status,
      vi.fn(),
    );

    // Assert
    expect(canEditCharacterName.value).toBe(true);
  });

  it('completed ステータスのとき false', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([makeMember()]);

    // Act
    const { canEditCharacterName } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.completed,
      vi.fn(),
    );

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });

  it('メンバーでない場合は false', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([]);

    // Act
    const { canEditCharacterName } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });

  it('status が undefined の場合は false', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([makeMember()]);

    // Act
    const { canEditCharacterName } = useMemberEdit(
      SESSION_ID,
      members,
      () => undefined,
      vi.fn(),
    );

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });
});

describe('startEdit / cancelEdit', () => {
  it('startEdit を呼ぶと isEditing が true になり draftCharacterName が現在値で初期化される', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { isEditing, draftCharacterName, startEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );

    // Act
    startEdit();

    // Assert
    expect(isEditing.value).toBe(true);
    expect(draftCharacterName.value).toBe(CHARACTER_NAME);
  });

  it('startEdit を呼ぶと characterName が null の場合は空文字で初期化される', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([
      makeMember({ characterName: null }),
    ]);
    const { draftCharacterName, startEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );

    // Act
    startEdit();

    // Assert
    expect(draftCharacterName.value).toBe('');
  });

  it('cancelEdit を呼ぶと isEditing が false になる', () => {
    // Arrange
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { isEditing, startEdit, cancelEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );
    startEdit();

    // Act
    cancelEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });
});

describe('submitEdit', () => {
  it('API を呼び出し、更新後メンバーを onUpdated に渡す', async () => {
    // Arrange
    const updatedMember = makeMember({ characterName: '新しい名前' });
    vi.mocked(updateMember).mockResolvedValue(updatedMember);
    const onUpdated = vi.fn();

    const members = ref<GameSessionMember[]>([makeMember()]);
    const { draftCharacterName, startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      onUpdated,
    );
    startEdit();
    draftCharacterName.value = '新しい名前';

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID, {
      characterName: '新しい名前',
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedMember);
  });

  it('成功後に isEditing が false になる', async () => {
    // Arrange
    vi.mocked(updateMember).mockResolvedValue(makeMember());
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { isEditing, startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('API 呼び出し中は loading が true になる', async () => {
    // Arrange
    let resolveUpdate!: () => void;
    vi.mocked(updateMember).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = () => resolve(makeMember());
      }),
    );
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { loading, startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );
    startEdit();

    // Act
    const promise = submitEdit();
    expect(loading.value).toBe(true);

    resolveUpdate();
    await promise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API が失敗した場合は toast.error を呼び出す', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(updateMember).mockRejectedValue(new Error('API error'));

    const members = ref<GameSessionMember[]>([makeMember()]);
    const { startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(toastError).toHaveBeenCalledWith('キャラクター名の更新に失敗しました');
  });

  it('API が失敗しても isEditing は true のまま（編集状態を維持する）', async () => {
    // Arrange
    vi.mocked(updateMember).mockRejectedValue(new Error('API error'));
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { isEditing, startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(true);
  });

  it('API が失敗した場合は onUpdated を呼び出さない', async () => {
    // Arrange
    vi.mocked(updateMember).mockRejectedValue(new Error('API error'));
    const onUpdated = vi.fn();
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      onUpdated,
    );
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    // Arrange
    let resolveUpdate!: () => void;
    vi.mocked(updateMember).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = () => resolve(makeMember());
      }),
    );
    const members = ref<GameSessionMember[]>([makeMember()]);
    const { startEdit, submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );
    startEdit();

    // Act
    const first = submitEdit();
    const second = submitEdit();
    resolveUpdate();
    await Promise.all([first, second]);

    // Assert
    expect(updateMember).toHaveBeenCalledTimes(1);
  });

  it('自分のメンバーが存在しない場合は API を呼び出さない', async () => {
    // Arrange
    const members = ref<GameSessionMember[]>([]);
    const { submitEdit } = useMemberEdit(
      SESSION_ID,
      members,
      () => GameSessionStatus.open,
      vi.fn(),
    );

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).not.toHaveBeenCalled();
  });
});
