import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSeatManagement } from '@/features/GameSession/Detail/useSeatManagement';
import { GameSessionStatus } from '@taku-biyori/shared';
import type { SeatModel } from '@/models/game-session';
import type { LobbyEntryModel } from '@/models/lobby';

vi.mock('@/api/game-session', () => ({
  createSeat: vi.fn(),
  deleteSeat: vi.fn(),
}));
vi.mock('@/stores/auth', () => ({ useAuthStore: vi.fn() }));

const mockToastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: mockToastError }),
}));

import { createSeat, deleteSeat } from '@/api/game-session';
import { useAuthStore } from '@/stores/auth';

const HOST_USER_ID = 'host-user-id';
const MEMBER_USER_ID = 'member-user-id';
const LOBBY_ID = 'lobby-1';
const SESSION_ID = 'session-1';

const makeEntry = (id: string, userId: string | null): LobbyEntryModel => ({
  id,
  userId,
  userName: userId ? 'ユーザー' : null,
  guestName: userId ? null : 'ゲスト',
  joinedAt: new Date('2026-08-01T00:00:00.000Z'),
  leftAt: null,
});

const makeSeat = (
  id: string,
  entryId: string,
  userId: string | null,
): SeatModel => ({
  id,
  entryId,
  userId,
  userName: userId ? 'ユーザー' : null,
  guestName: userId ? null : 'ゲスト',
  characterName: null,
  seatedAt: new Date('2026-08-30T10:00:00.000Z'),
  isGuest: userId === null,
});

const setup = (options: {
  status?: GameSessionStatus;
  userId?: string | null;
  seats?: SeatModel[];
  entries?: LobbyEntryModel[];
}) => {
  const userId = options.userId === undefined ? HOST_USER_ID : options.userId;
  vi.mocked(useAuthStore).mockReturnValue({
    currentUser: userId ? { id: userId } : null,
  } as unknown as ReturnType<typeof useAuthStore>);
  const onSeated = vi.fn();
  const onUnseated = vi.fn();
  const composable = useSeatManagement(
    LOBBY_ID,
    SESSION_ID,
    ref(options.status ?? GameSessionStatus.scheduled),
    ref(HOST_USER_ID),
    ref(options.seats ?? []),
    ref(options.entries ?? []),
    onSeated,
    onUnseated,
  );
  return { ...composable, onSeated, onUnseated };
};

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('canSeat', () => {
  it.each([GameSessionStatus.scheduled, GameSessionStatus.today])(
    '%s のときホストは着席させられる',
    (status) => {
      // Arrange / Act
      const { canSeat } = setup({ status });

      // Assert
      expect(canSeat.value).toBe(true);
    },
  );

  it.each([GameSessionStatus.completed, GameSessionStatus.cancelled])(
    '%s のときは着席させられない',
    (status) => {
      // Arrange / Act
      const { canSeat } = setup({ status });

      // Assert
      expect(canSeat.value).toBe(false);
    },
  );

  it('ホスト以外は着席させられない（選出はホストの仕事。design-v2 §6-6）', () => {
    // Arrange / Act
    const { canSeat } = setup({ userId: MEMBER_USER_ID });

    // Assert
    expect(canSeat.value).toBe(false);
  });
});

describe('seatableEntries', () => {
  it('まだ着席していない在籍者だけを候補に出す', () => {
    // Arrange
    const seated = makeEntry('entry-1', MEMBER_USER_ID);
    const notSeated = makeEntry('entry-2', 'other-user');

    // Act
    const { seatableEntries } = setup({
      entries: [seated, notSeated],
      seats: [makeSeat('seat-1', 'entry-1', MEMBER_USER_ID)],
    });

    // Assert
    expect(seatableEntries.value.map((e) => e.id)).toEqual(['entry-2']);
  });

  it('全員着席済みなら空になる', () => {
    // Arrange / Act
    const { seatableEntries } = setup({
      entries: [makeEntry('entry-1', MEMBER_USER_ID)],
      seats: [makeSeat('seat-1', 'entry-1', MEMBER_USER_ID)],
    });

    // Assert
    expect(seatableEntries.value).toEqual([]);
  });
});

describe('canUnseat', () => {
  it('ホストは他人の席も外せる', () => {
    // Arrange
    const seat = makeSeat('seat-1', 'entry-1', MEMBER_USER_ID);

    // Act
    const { canUnseat } = setup({ seats: [seat] });

    // Assert
    expect(canUnseat(seat)).toBe(true);
  });

  it('本人は自分の席を外せる', () => {
    // Arrange
    const seat = makeSeat('seat-1', 'entry-1', MEMBER_USER_ID);

    // Act
    const { canUnseat } = setup({ seats: [seat], userId: MEMBER_USER_ID });

    // Assert
    expect(canUnseat(seat)).toBe(true);
  });

  it('他人は外せない', () => {
    // Arrange
    const seat = makeSeat('seat-1', 'entry-1', MEMBER_USER_ID);

    // Act
    const { canUnseat } = setup({ seats: [seat], userId: 'stranger' });

    // Assert
    expect(canUnseat(seat)).toBe(false);
  });

  it('ゲストの席は本人性が成立しないのでホストだけが外せる', () => {
    // Arrange
    const guestSeat = makeSeat('seat-1', 'entry-1', null);

    // Act
    const asHost = setup({ seats: [guestSeat] });
    const asStranger = setup({ seats: [guestSeat], userId: 'stranger' });

    // Assert
    expect(asHost.canUnseat(guestSeat)).toBe(true);
    expect(asStranger.canUnseat(guestSeat)).toBe(false);
  });

  it('終わった開催では外せない', () => {
    // Arrange
    const seat = makeSeat('seat-1', 'entry-1', MEMBER_USER_ID);

    // Act
    const { canUnseat } = setup({
      seats: [seat],
      status: GameSessionStatus.completed,
    });

    // Assert
    expect(canUnseat(seat)).toBe(false);
  });
});

describe('seat', () => {
  it('API を呼んで onSeated へ返す', async () => {
    // Arrange
    const created = makeSeat('seat-1', 'entry-1', MEMBER_USER_ID);
    vi.mocked(createSeat).mockResolvedValue(created);
    const { seat, onSeated } = setup({});

    // Act
    await seat('entry-1');

    // Assert
    expect(createSeat).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, {
      entryId: 'entry-1',
    });
    expect(onSeated).toHaveBeenCalledWith(created);
  });

  it('着席させられない状態なら API を呼ばない', async () => {
    // Arrange
    const { seat } = setup({ status: GameSessionStatus.cancelled });

    // Act
    await seat('entry-1');

    // Assert
    expect(createSeat).not.toHaveBeenCalled();
  });

  it('失敗すると toast.error を出す', async () => {
    // Arrange
    vi.mocked(createSeat).mockRejectedValue(new Error('boom'));
    const { seat, onSeated } = setup({});

    // Act
    await seat('entry-1');

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('着席させられませんでした');
    expect(onSeated).not.toHaveBeenCalled();
  });
});

describe('unseat', () => {
  it('API を呼んで onUnseated へ返す', async () => {
    // Arrange
    vi.mocked(deleteSeat).mockResolvedValue(undefined);
    const { unseat, onUnseated } = setup({});

    // Act
    await unseat('seat-1');

    // Assert
    expect(deleteSeat).toHaveBeenCalledWith(LOBBY_ID, SESSION_ID, 'seat-1');
    expect(onUnseated).toHaveBeenCalledWith('seat-1');
  });

  it('失敗すると toast.error を出す', async () => {
    // Arrange
    vi.mocked(deleteSeat).mockRejectedValue(new Error('boom'));
    const { unseat, onUnseated } = setup({});

    // Act
    await unseat('seat-1');

    // Assert
    expect(mockToastError).toHaveBeenCalledWith('離席できませんでした');
    expect(onUnseated).not.toHaveBeenCalled();
  });
});
