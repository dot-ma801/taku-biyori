import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useGuestJoin } from '@/features/Lobby/Detail/composables/useGuestJoin';
import { LobbyStatus } from '@taku-biyori/shared';
import type { LobbyEntryModel } from '@/models/lobby';

vi.mock('@/api/lobby', () => ({
  joinLobbyAsGuest: vi.fn(),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: mockToastSuccess, error: mockToastError }),
}));

import { joinLobbyAsGuest } from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const TOKEN = 'guest-token-abc';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('canGuestJoin', () => {
  it('トークンがあり status が open のとき true', () => {
    // Act
    const { canGuestJoin } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(canGuestJoin.value).toBe(true);
  });

  it('トークンが null のとき false', () => {
    // Act
    const { canGuestJoin } = useGuestJoin(
      LOBBY_ID,
      null,
      LobbyStatus.open,
      vi.fn(),
    );

    // Assert
    expect(canGuestJoin.value).toBe(false);
  });

  it('status が open 以外のとき false', () => {
    // Act
    const { canGuestJoin } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.scheduling,
      vi.fn(),
    );

    // Assert
    expect(canGuestJoin.value).toBe(false);
  });

  it('token が getter で渡されても評価できる', () => {
    // Arrange
    const token = ref<string | null>(null);

    // Act
    const { canGuestJoin } = useGuestJoin(
      LOBBY_ID,
      () => token.value,
      LobbyStatus.open,
      vi.fn(),
    );
    expect(canGuestJoin.value).toBe(false);
    token.value = TOKEN;

    // Assert
    expect(canGuestJoin.value).toBe(true);
  });
});

describe('canSubmit', () => {
  it('ゲスト名が入力されていれば true', () => {
    // Arrange
    const { guestName, canSubmit } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    guestName.value = 'ゲスト太郎';

    // Assert
    expect(canSubmit.value).toBe(true);
  });

  it('ゲスト名が空白のみのとき false', () => {
    // Arrange
    const { guestName, canSubmit } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      vi.fn(),
    );

    // Act
    guestName.value = '   ';

    // Assert
    expect(canSubmit.value).toBe(false);
  });
});

describe('join', () => {
  it('joinLobbyAsGuest を token とトリムした入力値で呼び出す', async () => {
    // Arrange
    vi.mocked(joinLobbyAsGuest).mockResolvedValue({
      id: 'member-guest-1',
      userId: null,
      userName: null,
      guestName: 'ゲスト太郎',
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      leftAt: null,
    });
    const { guestName, join } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      vi.fn(),
    );
    guestName.value = '  ゲスト太郎  ';

    // Act
    await join();

    // Assert
    expect(joinLobbyAsGuest).toHaveBeenCalledWith(LOBBY_ID, TOKEN, {
      guestName: 'ゲスト太郎',
    });
  });

  it('成功時に作成されたメンバーを onJoined へ渡し、入力をリセットする', async () => {
    // Arrange
    const createdMember: LobbyEntryModel = {
      id: 'member-guest-1',
      userId: null,
      userName: null,
      guestName: 'ゲスト太郎',
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      leftAt: null,
    };
    vi.mocked(joinLobbyAsGuest).mockResolvedValue(createdMember);
    const onJoined = vi.fn();
    const { guestName, join } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      onJoined,
    );
    guestName.value = 'ゲスト太郎';

    // Act
    await join();

    // Assert
    expect(onJoined).toHaveBeenCalledWith(createdMember);
    expect(guestName.value).toBe('');
  });

  it('ゲスト名が空のときは API を呼ばない', async () => {
    // Arrange
    const { join } = useGuestJoin(LOBBY_ID, TOKEN, LobbyStatus.open, vi.fn());

    // Act
    await join();

    // Assert
    expect(joinLobbyAsGuest).not.toHaveBeenCalled();
  });

  it('ゲスト名が空のときは「ゲストユーザ名を入力してください」トーストを表示する', async () => {
    // Arrange
    const { join } = useGuestJoin(LOBBY_ID, TOKEN, LobbyStatus.open, vi.fn());

    // Act
    await join();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith(
      'ゲストユーザ名を入力してください',
    );
  });

  it('token が null のときは「招待用リンクからのみ参加が可能です」トーストを表示する', async () => {
    // Arrange
    const { guestName, join } = useGuestJoin(
      LOBBY_ID,
      null,
      LobbyStatus.open,
      vi.fn(),
    );
    guestName.value = 'ゲスト太郎';

    // Act
    await join();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith(
      '招待用リンクからのみ参加が可能です',
    );
  });

  it('token が null のときは API を呼ばない', async () => {
    // Arrange
    const { guestName, join } = useGuestJoin(
      LOBBY_ID,
      null,
      LobbyStatus.open,
      vi.fn(),
    );
    guestName.value = 'ゲスト太郎';

    // Act
    await join();

    // Assert
    expect(joinLobbyAsGuest).not.toHaveBeenCalled();
  });

  it('API エラー時に error トーストを表示する', async () => {
    // Arrange
    vi.mocked(joinLobbyAsGuest).mockRejectedValue(new Error('サーバーエラー'));
    const { guestName, join } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      vi.fn(),
    );
    guestName.value = 'ゲスト太郎';

    // Act
    await join();

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('参加に失敗しました');
  });

  it('loading 中の重複呼び出しは無視する', async () => {
    // Arrange
    let resolve!: (member: LobbyEntryModel) => void;
    vi.mocked(joinLobbyAsGuest).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { guestName, join } = useGuestJoin(
      LOBBY_ID,
      TOKEN,
      LobbyStatus.open,
      vi.fn(),
    );
    guestName.value = 'ゲスト太郎';

    // Act
    const first = join();
    await join();
    resolve({
      id: 'member-guest-1',
      userId: null,
      userName: null,
      guestName: 'ゲスト太郎',
      joinedAt: new Date('2026-01-01T00:00:00Z'),
      leftAt: null,
    });
    await first;

    // Assert
    expect(joinLobbyAsGuest).toHaveBeenCalledTimes(1);
  });
});
