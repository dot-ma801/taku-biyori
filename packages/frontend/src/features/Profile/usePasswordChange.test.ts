import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePasswordChange } from '@/features/Profile/usePasswordChange';

vi.mock('@/lib/auth', () => ({
  changePassword: vi.fn(),
}));

vi.mock('@/composables/useToast', () => ({
  useToast: vi.fn(),
}));

import { changePassword } from '@/lib/auth';
import { useToast } from '@/composables/useToast';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({
    success: vi.fn(),
    error: vi.fn(),
  } as unknown as ReturnType<typeof useToast>);
});

describe('startEdit / cancelEdit', () => {
  it('startEdit を呼ぶと isEditing が true になり全フィールドが空文字になる', () => {
    // Arrange
    const {
      isEditing,
      currentPassword,
      newPassword,
      confirmPassword,
      startEdit,
    } = usePasswordChange();

    // Act
    startEdit();

    // Assert
    expect(isEditing.value).toBe(true);
    expect(currentPassword.value).toBe('');
    expect(newPassword.value).toBe('');
    expect(confirmPassword.value).toBe('');
  });

  it('cancelEdit を呼ぶと isEditing が false になる', () => {
    // Arrange
    const { isEditing, startEdit, cancelEdit } = usePasswordChange();
    startEdit();

    // Act
    cancelEdit();

    // Assert
    expect(isEditing.value).toBe(false);
  });

  it('cancelEdit を呼ぶと入力中のパスワードが破棄される', () => {
    // Arrange
    const {
      currentPassword,
      newPassword,
      confirmPassword,
      startEdit,
      cancelEdit,
    } = usePasswordChange();
    startEdit();
    currentPassword.value = '現在のパスワード';
    newPassword.value = 'new-password-1234';
    confirmPassword.value = 'new-password-1234';

    // Act
    cancelEdit();

    // Assert
    expect(currentPassword.value).toBe('');
    expect(newPassword.value).toBe('');
    expect(confirmPassword.value).toBe('');
  });
});

describe('canSubmit', () => {
  it('現在のパスワード・新しいパスワードが入力され、確認用と一致していれば true', () => {
    // Arrange
    const {
      canSubmit,
      currentPassword,
      newPassword,
      confirmPassword,
      startEdit,
    } = usePasswordChange();
    startEdit();

    // Act
    currentPassword.value = '現在のパスワード';
    newPassword.value = 'new-password-1234';
    confirmPassword.value = 'new-password-1234';

    // Assert
    expect(canSubmit.value).toBe(true);
  });

  it('現在のパスワードが空なら false', () => {
    // Arrange
    const { canSubmit, newPassword, confirmPassword, startEdit } =
      usePasswordChange();
    startEdit();

    // Act
    newPassword.value = 'new-password-1234';
    confirmPassword.value = 'new-password-1234';

    // Assert
    expect(canSubmit.value).toBe(false);
  });

  it('新しいパスワードが8文字未満なら false', () => {
    // Arrange
    const {
      canSubmit,
      currentPassword,
      newPassword,
      confirmPassword,
      startEdit,
    } = usePasswordChange();
    startEdit();

    // Act
    currentPassword.value = '現在のパスワード';
    newPassword.value = 'short1';
    confirmPassword.value = 'short1';

    // Assert
    expect(canSubmit.value).toBe(false);
  });

  it('新しいパスワードと確認用が一致しなければ false', () => {
    // Arrange
    const {
      canSubmit,
      currentPassword,
      newPassword,
      confirmPassword,
      startEdit,
    } = usePasswordChange();
    startEdit();

    // Act
    currentPassword.value = '現在のパスワード';
    newPassword.value = 'new-password-1234';
    confirmPassword.value = 'different-password';

    // Assert
    expect(canSubmit.value).toBe(false);
  });
});

describe('submitEdit', () => {
  function fillValid(fields: ReturnType<typeof usePasswordChange>) {
    fields.startEdit();
    fields.currentPassword.value = '現在のパスワード';
    fields.newPassword.value = 'new-password-1234';
    fields.confirmPassword.value = 'new-password-1234';
  }

  it('canSubmit のとき changePassword を呼び出す', async () => {
    // Arrange
    vi.mocked(changePassword).mockResolvedValue({
      data: { token: null },
      error: null,
    } as Awaited<ReturnType<typeof changePassword>>);
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    await fields.submitEdit();

    // Assert
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: '現在のパスワード',
      newPassword: 'new-password-1234',
      revokeOtherSessions: true,
    });
  });

  it('canSubmit でないときは changePassword を呼び出さない', async () => {
    // Arrange
    const fields = usePasswordChange();
    fields.startEdit();

    // Act
    await fields.submitEdit();

    // Assert
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('成功時は toast.success を呼び出し isEditing を false にする', async () => {
    // Arrange
    const toastSuccess = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      success: toastSuccess,
      error: vi.fn(),
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(changePassword).mockResolvedValue({
      data: { token: null },
      error: null,
    } as Awaited<ReturnType<typeof changePassword>>);
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    await fields.submitEdit();

    // Assert
    expect(toastSuccess).toHaveBeenCalledWith('パスワードを変更しました');
    expect(fields.isEditing.value).toBe(false);
  });

  it('成功時は入力中のパスワードを破棄する', async () => {
    // Arrange
    vi.mocked(changePassword).mockResolvedValue({
      data: { token: null },
      error: null,
    } as Awaited<ReturnType<typeof changePassword>>);
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    await fields.submitEdit();

    // Assert
    expect(fields.currentPassword.value).toBe('');
    expect(fields.newPassword.value).toBe('');
    expect(fields.confirmPassword.value).toBe('');
  });

  it('API がエラーを返した場合は toast.error を呼び出し isEditing を維持する', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      success: vi.fn(),
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(changePassword).mockResolvedValue({
      data: null,
      error: { message: '現在のパスワードが正しくありません' },
    } as Awaited<ReturnType<typeof changePassword>>);
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    await fields.submitEdit();

    // Assert
    expect(toastError).toHaveBeenCalledWith(
      '現在のパスワードが正しくありません',
    );
    expect(fields.isEditing.value).toBe(true);
  });

  it('API がエラーメッセージ無しでエラーを返した場合は汎用メッセージを表示する', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      success: vi.fn(),
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(changePassword).mockResolvedValue({
      data: null,
      error: {},
    } as Awaited<ReturnType<typeof changePassword>>);
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    await fields.submitEdit();

    // Assert
    expect(toastError).toHaveBeenCalledWith('パスワードの変更に失敗しました');
  });

  it('例外が発生した場合も toast.error を呼び出し isEditing を維持する', async () => {
    // Arrange
    const toastError = vi.fn();
    vi.mocked(useToast).mockReturnValue({
      success: vi.fn(),
      error: toastError,
    } as unknown as ReturnType<typeof useToast>);
    vi.mocked(changePassword).mockRejectedValue(new Error('network error'));
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    await fields.submitEdit();

    // Assert
    expect(toastError).toHaveBeenCalledWith('パスワードの変更に失敗しました');
    expect(fields.isEditing.value).toBe(true);
  });

  it('API 呼び出し中は loading が true になる', async () => {
    // Arrange
    let resolveChange!: (value: { data: { token: null }; error: null }) => void;
    vi.mocked(changePassword).mockReturnValue(
      new Promise((resolve) => {
        resolveChange = resolve;
      }) as ReturnType<typeof changePassword>,
    );
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    const promise = fields.submitEdit();
    expect(fields.loading.value).toBe(true);
    resolveChange({ data: { token: null }, error: null });
    await promise;

    // Assert
    expect(fields.loading.value).toBe(false);
  });

  it('二重送信を防ぐ（loading 中は再呼び出しを無視する）', async () => {
    // Arrange
    let resolveChange!: (value: { data: { token: null }; error: null }) => void;
    vi.mocked(changePassword).mockReturnValue(
      new Promise((resolve) => {
        resolveChange = resolve;
      }) as ReturnType<typeof changePassword>,
    );
    const fields = usePasswordChange();
    fillValid(fields);

    // Act
    const first = fields.submitEdit();
    const second = fields.submitEdit();
    resolveChange({ data: { token: null }, error: null });
    await Promise.all([first, second]);

    // Assert
    expect(changePassword).toHaveBeenCalledTimes(1);
  });
});
