import { describe, it, expect, vi, beforeEach } from 'vitest';
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
// ログインユーザー＝このセッションのホスト（GM）
const HOST_USER_ID = 'user-1';
const MEMBER_ID = 'member-1';
const MEMBER_ID_2 = 'member-2';
const CHARACTER_NAME = 'アリス';

function makeMember(
  overrides: Partial<GameSessionMember> = {},
): GameSessionMember {
  return {
    id: MEMBER_ID,
    userId: HOST_USER_ID,
    userName: 'テストユーザー',
    guestName: null,
    characterName: CHARACTER_NAME,
    joinedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// useMemberEdit を既定値つきで生成するヘルパー
function setup(
  opts: {
    members?: GameSessionMember[];
    status?: GameSessionStatus | undefined;
    createdBy?: string;
    onUpdated?: (updated: GameSessionMember) => void;
  } = {},
) {
  // status は undefined を明示的に渡すケースがあるため、?? ではなくキー有無で判定する
  const status = 'status' in opts ? opts.status : GameSessionStatus.open;
  return useMemberEdit(
    SESSION_ID,
    () => opts.members ?? [makeMember()],
    () => status,
    () => opts.createdBy ?? HOST_USER_ID,
    opts.onUpdated ?? vi.fn(),
  );
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: { id: HOST_USER_ID },
  } as ReturnType<typeof useAuthStore>);
  vi.mocked(useToast).mockReturnValue({
    error: vi.fn(),
  } as unknown as ReturnType<typeof useToast>);
});

describe('canEditCharacterName', () => {
  it.each([
    GameSessionStatus.open,
    GameSessionStatus.scheduling,
    GameSessionStatus.confirmed,
    GameSessionStatus.today,
  ])('ホストかつ %s ステータスのとき true', (status) => {
    // Arrange & Act
    const { canEditCharacterName } = setup({ status });

    // Assert
    expect(canEditCharacterName.value).toBe(true);
  });

  it('completed ステータスのとき false', () => {
    // Arrange & Act
    const { canEditCharacterName } = setup({
      status: GameSessionStatus.completed,
    });

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });

  it('ホストでない（createdBy が別ユーザー）場合は false', () => {
    // Arrange & Act
    const { canEditCharacterName } = setup({ createdBy: 'other-user' });

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });

  it('status が undefined の場合は false', () => {
    // Arrange & Act
    const { canEditCharacterName } = setup({ status: undefined });

    // Assert
    expect(canEditCharacterName.value).toBe(false);
  });
});

describe('startEdit / cancelEdit', () => {
  it('startEdit を呼ぶと isEditing が true になり各メンバーの draft が現在値で初期化される', () => {
    // Arrange
    const members = [
      makeMember(),
      makeMember({ id: MEMBER_ID_2, userId: 'user-2', characterName: 'ボブ' }),
    ];
    const { isEditing, draftOf, startEdit } = setup({ members });

    // Act
    startEdit();

    // Assert
    expect(isEditing.value).toBe(true);
    expect(draftOf(MEMBER_ID)).toBe(CHARACTER_NAME);
    expect(draftOf(MEMBER_ID_2)).toBe('ボブ');
  });

  it('characterName が null のメンバーは空文字で初期化される', () => {
    // Arrange
    const members = [makeMember({ characterName: null })];
    const { draftOf, startEdit } = setup({ members });

    // Act
    startEdit();

    // Assert
    expect(draftOf(MEMBER_ID)).toBe('');
  });

  it('cancelEdit を呼ぶと isEditing が false になる', () => {
    // Arrange
    const { isEditing, startEdit, cancelEdit } = setup();
    startEdit();

    // Act
    cancelEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });
});

describe('isDirty', () => {
  it('全 draft が baseline と同じなら false', () => {
    // Arrange
    const { isDirty, startEdit } = setup();

    // Act
    startEdit(); // baseline と同じ値で初期化される

    // Assert
    expect(isDirty.value).toBe(false);
  });

  it('いずれかの draft を baseline から変更すると true', () => {
    // Arrange
    const members = [
      makeMember(),
      makeMember({ id: MEMBER_ID_2, userId: 'user-2', characterName: 'ボブ' }),
    ];
    const { isDirty, setDraft, startEdit } = setup({ members });
    startEdit();

    // Act
    setDraft(MEMBER_ID_2, '別の名前');

    // Assert
    expect(isDirty.value).toBe(true);
  });

  it('characterName が null のメンバーで draft が空文字なら false', () => {
    // Arrange
    const members = [makeMember({ characterName: null })];
    const { isDirty, startEdit } = setup({ members });

    // Act
    startEdit(); // null → '' で初期化される

    // Assert
    expect(isDirty.value).toBe(false);
  });
});

describe('submitEdit', () => {
  it('変更されたメンバーごとに API を呼び出し、更新後メンバーを onUpdated に渡す', async () => {
    // Arrange
    const updatedMember = makeMember({ characterName: '新しい名前' });
    vi.mocked(updateMember).mockResolvedValue(updatedMember);
    const onUpdated = vi.fn();

    const { setDraft, startEdit, submitEdit } = setup({
      onUpdated,
    });
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID, {
      characterName: '新しい名前',
    });
    expect(onUpdated).toHaveBeenCalledWith(updatedMember);
  });

  it('複数メンバーを変更すると、変更分だけ API を呼ぶ', async () => {
    // Arrange
    vi.mocked(updateMember).mockImplementation(async (_s, memberId) =>
      makeMember({ id: memberId }),
    );
    const members = [
      makeMember(),
      makeMember({ id: MEMBER_ID_2, userId: 'user-2', characterName: 'ボブ' }),
    ];
    const { setDraft, startEdit, submitEdit } = setup({ members });
    startEdit();
    setDraft(MEMBER_ID, '新A');
    setDraft(MEMBER_ID_2, '新B');

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).toHaveBeenCalledTimes(2);
    expect(updateMember).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID, {
      characterName: '新A',
    });
    expect(updateMember).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID_2, {
      characterName: '新B',
    });
  });

  it('変更がないメンバーには API を呼び出さない', async () => {
    // Arrange
    const members = [
      makeMember(),
      makeMember({ id: MEMBER_ID_2, userId: 'user-2', characterName: 'ボブ' }),
    ];
    vi.mocked(updateMember).mockResolvedValue(makeMember());
    const { setDraft, startEdit, submitEdit } = setup({ members });
    startEdit();
    setDraft(MEMBER_ID, '新A'); // member-1 のみ変更

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).toHaveBeenCalledTimes(1);
    expect(updateMember).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID, {
      characterName: '新A',
    });
  });

  it('空文字に変更した場合は characterName: null を送る', async () => {
    // Arrange
    vi.mocked(updateMember).mockResolvedValue(makeMember());
    const { setDraft, startEdit, submitEdit } = setup();
    startEdit();
    setDraft(MEMBER_ID, '');

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).toHaveBeenCalledWith(SESSION_ID, MEMBER_ID, {
      characterName: null,
    });
  });

  it('変更が一つも無い場合は API を呼び出さない', async () => {
    // Arrange
    const { startEdit, submitEdit } = setup();
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(updateMember).not.toHaveBeenCalled();
  });

  it('成功後に isEditing が false になる', async () => {
    // Arrange
    vi.mocked(updateMember).mockResolvedValue(makeMember());
    const { isEditing, setDraft, startEdit, submitEdit } = setup();
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

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
    const { loading, setDraft, startEdit, submitEdit } = setup();
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

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

    const { setDraft, startEdit, submitEdit } = setup();
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

    // Act
    await submitEdit();

    // Assert
    expect(toastError).toHaveBeenCalledWith(
      'キャラクター名の更新に失敗しました',
    );
  });

  it('API が失敗しても isEditing は true のまま（編集状態を維持する）', async () => {
    // Arrange
    vi.mocked(updateMember).mockRejectedValue(new Error('API error'));
    const { isEditing, setDraft, startEdit, submitEdit } = setup();
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

    // Act
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(true);
  });

  it('API が失敗した場合は onUpdated を呼び出さない', async () => {
    // Arrange
    vi.mocked(updateMember).mockRejectedValue(new Error('API error'));
    const onUpdated = vi.fn();
    const { setDraft, startEdit, submitEdit } = setup({
      onUpdated,
    });
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

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
    const { setDraft, startEdit, submitEdit } = setup();
    startEdit();
    setDraft(MEMBER_ID, '新しい名前');

    // Act
    const first = submitEdit();
    const second = submitEdit();
    resolveUpdate();
    await Promise.all([first, second]);

    // Assert
    expect(updateMember).toHaveBeenCalledTimes(1);
  });
});
