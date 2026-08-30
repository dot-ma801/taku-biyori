import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { LobbyDetailModel } from '@/models/lobby';
import { LobbyStatus } from '@taku-biyori/shared';
import { useUpdateLobby } from '@/features/Lobby/Edit/composables/useUpdateLobby';
import { ApiError } from '@/lib/api-client';

vi.mock('@/api/lobby', () => ({
  bulkUpdateLobbyAvailabilityDates: vi.fn(),
  getLobby: vi.fn(),
  listLobbyAvailabilityDates: vi.fn(),
  updateLobby: vi.fn(),
}));

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: pushMock, back: backMock })),
}));

import {
  bulkUpdateLobbyAvailabilityDates,
  getLobby,
  listLobbyAvailabilityDates,
  updateLobby,
} from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const lobby: LobbyDetailModel = {
  id: LOBBY_ID,
  title: 'Test lobby',
  scenarioName: 'Scenario',
  description: 'Description',
  location: 'Tokyo',
  maxPlayers: 4,
  status: LobbyStatus.draft,
  openUntil: '2026-07-20',
  hostUserId: 'user-1',
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  entries: [],
  activeEntries: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLobby).mockResolvedValue(lobby);
  vi.mocked(listLobbyAvailabilityDates).mockResolvedValue([
    {
      id: 'date-1',
      date: '2026-07-25',
      dateNote: '13:00〜17:00',
      answers: [],
    },
  ]);
  vi.mocked(updateLobby).mockResolvedValue(lobby);
  vi.mocked(bulkUpdateLobbyAvailabilityDates).mockResolvedValue([]);
});

describe('useUpdateLobby', () => {
  it('fetches the lobby and initializes the form values', async () => {
    const {
      fetchInitialValues,
      title,
      scenarioName,
      maxMembers,
      description,
      openUntil,
      location,
      pendingDates,
    } = useUpdateLobby(LOBBY_ID);

    await fetchInitialValues();

    expect(getLobby).toHaveBeenCalledWith(LOBBY_ID);
    expect(title.value).toBe('Test lobby');
    expect(scenarioName.value).toBe('Scenario');
    expect(maxMembers.value).toBe('4');
    expect(description.value).toBe('Description');
    expect(openUntil.value).toBe('2026-07-20');
    expect(location.value).toBe('Tokyo');
    // 保存済みのひとことは編集フォームに引き継がれる（未入力は空文字で持つ）
    expect(pendingDates.value).toEqual([
      { date: '2026-07-25', dateNote: '13:00〜17:00' },
    ]);
  });

  // blur 時の rules は送信をブロックしないので、送信側でも同じ基準で弾く
  it('ひとことが上限を超えていたら更新をブロックする', async () => {
    const { title, pendingDates, errorMessages, submit } =
      useUpdateLobby(LOBBY_ID);
    title.value = 'Test lobby';
    pendingDates.value = [{ date: '2025-05-01', dateNote: 'あ'.repeat(21) }];

    await submit();

    expect(updateLobby).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual([
      '5/1（木）のひとことは20文字以内で入力してください',
    ]);
  });

  it('does not update when max members is outside the allowed range', async () => {
    const { title, pendingDates, maxMembers, errorMessages, submit } =
      useUpdateLobby(LOBBY_ID);
    title.value = 'Test lobby';
    pendingDates.value = [{ date: '2026-07-25', dateNote: '' }];
    maxMembers.value = '21';

    await submit();

    expect(updateLobby).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual([
      '募集人数は2〜20人の範囲で入力してください',
    ]);
  });

  it('does not update when title is empty', async () => {
    // Arrange
    const { title, pendingDates, errorMessages, submit } =
      useUpdateLobby(LOBBY_ID);
    title.value = '   ';
    pendingDates.value = [{ date: '2026-07-25', dateNote: '' }];

    // Act
    await submit();

    // Assert
    expect(updateLobby).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual(['タイトルを入力してください']);
  });

  it('does not update when there are no pending dates', async () => {
    // Arrange
    const { title, pendingDates, errorMessages, submit } =
      useUpdateLobby(LOBBY_ID);
    title.value = 'Test lobby';
    pendingDates.value = [];

    // Act
    await submit();

    // Assert
    expect(updateLobby).not.toHaveBeenCalled();
    expect(errorMessages.value).toEqual(['候補日を1件以上指定してください']);
  });

  it('updates the lobby and returns to its detail page', async () => {
    const {
      title,
      scenarioName,
      maxMembers,
      description,
      openUntil,
      location,
      pendingDates,
      submit,
    } = useUpdateLobby(LOBBY_ID);
    title.value = 'Updated lobby';
    scenarioName.value = '';
    maxMembers.value = '';
    description.value = '';
    openUntil.value = '';
    location.value = '';
    pendingDates.value = [{ date: '2026-07-25', dateNote: '' }];

    await submit();

    expect(updateLobby).toHaveBeenCalledWith(LOBBY_ID, {
      title: 'Updated lobby',
      scenarioName: null,
      maxPlayers: null,
      description: null,
      openUntil: null,
      location: null,
    });
    expect(bulkUpdateLobbyAvailabilityDates).toHaveBeenCalledWith(LOBBY_ID, {
      dates: [{ date: '2026-07-25', dateNote: null }],
    });
    expect(pushMock).toHaveBeenCalledWith({
      name: 'lobbies-detail',
      params: { lobbyId: LOBBY_ID },
    });
  });

  it('初期取得に失敗したとき fetchError を設定し、errorMessages には入れない', async () => {
    // Arrange
    vi.mocked(getLobby).mockRejectedValue(
      new ApiError(404, 'ロビーが見つかりません'),
    );
    const { fetchInitialValues, fetchError, errorMessages } =
      useUpdateLobby(LOBBY_ID);

    // Act
    await fetchInitialValues();

    // Assert
    expect(fetchError.value).toBe('ロビーが見つかりません');
    expect(errorMessages.value).toEqual([]);
  });

  it('初期取得の再試行に成功したとき fetchError をクリアする', async () => {
    // Arrange
    vi.mocked(getLobby).mockRejectedValueOnce(
      new ApiError(500, 'サーバーエラー'),
    );
    const { fetchInitialValues, fetchError, title } = useUpdateLobby(LOBBY_ID);
    await fetchInitialValues();
    expect(fetchError.value).not.toBe('');

    // Act
    await fetchInitialValues();

    // Assert
    expect(fetchError.value).toBe('');
    expect(title.value).toBe('Test lobby');
  });

  it('更新に失敗したとき errorMessages を設定し、fetchError には入れない', async () => {
    // Arrange
    vi.mocked(updateLobby).mockRejectedValue(
      new ApiError(403, '権限がありません'),
    );
    const { submit, errorMessages, fetchError, title, pendingDates } =
      useUpdateLobby(LOBBY_ID);
    title.value = 'Test lobby';
    pendingDates.value = [{ date: '2026-07-25', dateNote: '' }];

    // Act
    await submit();

    // Assert
    expect(errorMessages.value).toEqual(['権限がありません']);
    expect(fetchError.value).toBe('');
  });

  it('エラー後に入力を変更すると errorMessages がクリアされる', async () => {
    // Arrange
    const { maxMembers, errorMessages, submit } = useUpdateLobby(LOBBY_ID);
    maxMembers.value = '21';
    await submit();
    expect(errorMessages.value).not.toEqual([]);

    // Act
    maxMembers.value = '4';
    await nextTick();

    // Assert
    expect(errorMessages.value).toEqual([]);
  });

  it('returns to the previous page when cancelled', () => {
    const { cancel } = useUpdateLobby(LOBBY_ID);

    cancel();

    expect(backMock).toHaveBeenCalled();
  });
});
