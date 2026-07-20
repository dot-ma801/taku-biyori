import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileEdit } from '@/features/Profile/useProfileEdit';
import type { ProfileResponse } from '@taku-biyori/shared';

vi.mock('@/api/profile', () => ({
  updateProfile: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(),
}));

import { updateProfile } from '@/api/profile';
import { useToast } from '@/composables/useToast';

function makeProfile(
  overrides: Partial<ProfileResponse> = {},
): ProfileResponse {
  return {
    id: 'user-1',
    name: 'テストユーザー',
    email: 'test@example.com',
    image: null,
    ...overrides,
  };
}

// useProfileEdit を既定値つきで生成するヘルパー
function setup(
  opts: {
    profile?: ProfileResponse | null;
    onUpdated?: (updated: ProfileResponse) => void;
  } = {},
) {
  const profile = 'profile' in opts ? opts.profile : makeProfile();
  return useProfileEdit(() => profile ?? null, opts.onUpdated ?? vi.fn());
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({
    error: vi.fn(),
  } as unknown as ReturnType<typeof useToast>);
});

describe('startEdit / cancelEdit', () => {
  it('startEdit を呼ぶと isEditing が true になり draftName が現在の name で初期化される', () => {
    // Arrange
    const { isEditing, draftName, startEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });

    // Act
    startEdit();

    // Assert
    expect(isEditing.value).toBe(true);
    expect(draftName.value).toBe('元の名前');
  });

  it('name が null のときは空文字で初期化される', () => {
    // Arrange
    const { draftName, startEdit } = setup({
      profile: makeProfile({ name: null }),
    });

    // Act
    startEdit();

    // Assert
    expect(draftName.value).toBe('');
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
  it('draftName が baseline と同じなら false', () => {
    // Arrange
    const { isDirty, startEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });

    // Act
    startEdit();

    // Assert
    expect(isDirty.value).toBe(false);
  });

  it('draftName を変更すると true', () => {
    // Arrange
    const { isDirty, draftName, startEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();

    // Act
    draftName.value = '新しい名前';

    // Assert
    expect(isDirty.value).toBe(true);
  });
});

describe('canSubmit', () => {
  it('isDirty かつ trim して空でなければ true', () => {
    // Arrange
    const { canSubmit, draftName, startEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();

    // Act
    draftName.value = '新しい名前';

    // Assert
    expect(canSubmit.value).toBe(true);
  });

  it('draftName が空白のみの場合は false', () => {
    // Arrange
    const { canSubmit, draftName, startEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();

    // Act
    draftName.value = '   ';

    // Assert
    expect(canSubmit.value).toBe(false);
  });

  it('isDirty でなければ false', () => {
    // Arrange
    const { canSubmit, startEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });

    // Act
    startEdit();

    // Assert
    expect(canSubmit.value).toBe(false);
  });
});

describe('submitEdit', () => {
  it('trim した draftName で API を呼び出し、更新後プロフィールを onUpdated に渡す', async () => {
    // Arrange
    const updatedProfile = makeProfile({ name: '新しい名前' });
    vi.mocked(updateProfile).mockResolvedValue(updatedProfile);
    const onUpdated = vi.fn();
    const { draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
      onUpdated,
    });
    startEdit();

    // Act
    draftName.value = '  新しい名前  ';
    await submitEdit();

    // Assert
    expect(updateProfile).toHaveBeenCalledWith({ name: '新しい名前' });
    expect(onUpdated).toHaveBeenCalledWith(updatedProfile);
  });

  it('変更がない場合は API を呼び出さず isEditing を false にする', async () => {
    // Arrange
    const { isEditing, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();

    // Act
    await submitEdit();

    // Assert
    expect(updateProfile).not.toHaveBeenCalled();
    expect(isEditing.value).toBe(false);
  });

  it('draftName が空白のみの場合は API を呼び出さない', async () => {
    // Arrange
    const { draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();

    // Act
    draftName.value = '   ';
    await submitEdit();

    // Assert
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('成功後に isEditing が false になる', async () => {
    // Arrange
    vi.mocked(updateProfile).mockResolvedValue(
      makeProfile({ name: '新しい名前' }),
    );
    const { isEditing, draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();
    draftName.value = '新しい名前';

    // Act
    await submitEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('API 呼び出し中は loading が true になる', async () => {
    // Arrange
    let resolveUpdate!: (profile: ProfileResponse) => void;
    vi.mocked(updateProfile).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const { loading, draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();
    draftName.value = '新しい名前';

    // Act
    const promise = submitEdit();
    expect(loading.value).toBe(true);
    resolveUpdate(makeProfile({ name: '新しい名前' }));
    await promise;

    // Assert
    expect(loading.value).toBe(false);
  });

  it('API が失敗した場合は toast.error を呼び出し isEditing を維持する', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(updateProfile).mockRejectedValue(new Error('API error'));
    const { isEditing, draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();
    draftName.value = '新しい名前';

    // Act
    await submitEdit();

    // Assert
    expect(toastError).toHaveBeenCalledWith('ユーザー名の更新に失敗しました');
    expect(isEditing.value).toBe(true);
  });

  it('API が失敗した場合は onUpdated を呼び出さない', async () => {
    // Arrange
    vi.mocked(updateProfile).mockRejectedValue(new Error('API error'));
    const onUpdated = vi.fn();
    const { draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
      onUpdated,
    });
    startEdit();
    draftName.value = '新しい名前';

    // Act
    await submitEdit();

    // Assert
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    // Arrange
    let resolveUpdate!: (profile: ProfileResponse) => void;
    vi.mocked(updateProfile).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const { draftName, startEdit, submitEdit } = setup({
      profile: makeProfile({ name: '元の名前' }),
    });
    startEdit();
    draftName.value = '新しい名前';

    // Act
    const first = submitEdit();
    const second = submitEdit();
    resolveUpdate(makeProfile({ name: '新しい名前' }));
    await Promise.all([first, second]);

    // Assert
    expect(updateProfile).toHaveBeenCalledTimes(1);
  });
});
