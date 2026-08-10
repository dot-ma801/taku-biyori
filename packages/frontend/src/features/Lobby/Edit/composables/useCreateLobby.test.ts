import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { useCreateLobby } from '@/features/Lobby/Edit/composables/useCreateLobby';
import type { Lobby } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  createLobby: vi.fn(),
}));

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: pushMock, back: backMock })),
}));

import { createLobby } from '@/api/lobby';

const mockLobby: Lobby = {
  id: 'lobby-1',
  title: 'テスト募集枠',
  description: null,
  scenarioName: null,
  location: null,
  status: LobbyStatus.draft,
  isPublished: false,
  maxPlayers: null,
  openUntil: null,
  closedAt: null,
  cancelledAt: null,
  hostUserId: 'user-1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createLobby).mockResolvedValue(mockLobby);
});

describe('useCreateLobby', () => {
  describe('候補日のバリデーション', () => {
    it('候補日が0件だと送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual(['候補日を1件以上指定してください']);
    });

    it('候補日が1件以上あれば candidateDates として送信する', async () => {
      // Arrange
      const { title, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [
        { date: '2025-05-01', timeNote: null },
        { date: '2025-05-02', timeNote: null },
      ];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateDates: [
            { date: '2025-05-01', timeNote: null },
            { date: '2025-05-02', timeNote: null },
          ],
        }),
      );
    });
  });

  describe('タイトルのバリデーション', () => {
    it('タイトルが未入力だと送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual(['タイトルを入力してください']);
    });
  });

  describe('複数のバリデーションエラー', () => {
    it('タイトル未入力かつ候補日0件のとき、両方のエラーメッセージを表示する', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '';
      pendingDates.value = [];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual([
        'タイトルを入力してください',
        '候補日を1件以上指定してください',
      ]);
    });
  });

  describe('募集人数のバリデーション', () => {
    it('1（下限未満）を入力すると送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, maxMembers, pendingDates, errorMessages, submit } =
        useCreateLobby();
      title.value = '募集枠';
      maxMembers.value = '1';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual([
        '募集人数は2〜20人の範囲で入力してください',
      ]);
    });

    it('21（上限超過）を入力すると送信をブロックしエラーメッセージを表示する', async () => {
      // Arrange
      const { title, maxMembers, pendingDates, errorMessages, submit } =
        useCreateLobby();
      title.value = '募集枠';
      maxMembers.value = '21';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual([
        '募集人数は2〜20人の範囲で入力してください',
      ]);
    });

    it('2（下限）を入力すると maxPlayers: 2 で送信する', async () => {
      // Arrange
      const { title, maxMembers, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      maxMembers.value = '2';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith(
        expect.objectContaining({ maxPlayers: 2 }),
      );
    });

    it('未入力なら maxPlayers を含めずに送信する', async () => {
      // Arrange
      const { title, maxMembers, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      maxMembers.value = '';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith(
        expect.not.objectContaining({ maxPlayers: expect.anything() }),
      );
    });
  });

  describe('送信内容の組み立て', () => {
    it('未入力の任意項目は送信内容から除外する', async () => {
      // Arrange
      const { title, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith({
        title: '募集枠',
        candidateDates: [{ date: '2025-05-01', timeNote: null }],
      });
    });

    it('任意項目を入力すると送信内容に含める', async () => {
      // Arrange
      const {
        title,
        scenarioName,
        description,
        location,
        openUntil,
        pendingDates,
        submit,
      } = useCreateLobby();
      title.value = '募集枠';
      scenarioName.value = 'シナリオ';
      description.value = '説明文';
      location.value = 'ココフォリア';
      openUntil.value = '2025-04-30';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith(
        expect.objectContaining({
          scenarioName: 'シナリオ',
          description: '説明文',
          location: 'ココフォリア',
          openUntil: '2025-04-30',
        }),
      );
    });
  });

  describe('エラーメッセージのクリア', () => {
    it('バリデーションエラー後に入力を変更すると errorMessages がクリアされる', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '';
      pendingDates.value = [];
      await submit();
      expect(errorMessages.value).not.toEqual([]);

      // Act
      title.value = '募集枠';
      await nextTick();

      // Assert
      expect(errorMessages.value).toEqual([]);
    });

    it('候補日を変更した場合も errorMessages がクリアされる', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [];
      await submit();
      expect(errorMessages.value).not.toEqual([]);

      // Act
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];
      await nextTick();

      // Assert
      expect(errorMessages.value).toEqual([]);
    });
  });

  describe('送信失敗時', () => {
    it('API エラーになるとエラーメッセージを表示する', async () => {
      // Arrange
      vi.mocked(createLobby).mockRejectedValue(new Error('network error'));
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(errorMessages.value).toEqual(['エラーが発生しました']);
    });
  });

  describe('送信成功時の遷移', () => {
    it('作成したロビーの詳細画面へ遷移する', async () => {
      // Arrange
      const { title, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [{ date: '2025-05-01', timeNote: null }];

      // Act
      await submit();

      // Assert
      expect(pushMock).toHaveBeenCalledWith({
        name: 'lobbies-detail',
        params: { lobbyId: mockLobby.id },
      });
    });
  });

  describe('cancel', () => {
    it('呼び出すと1つ前の画面に戻る', () => {
      // Arrange
      const { cancel } = useCreateLobby();

      // Act
      cancel();

      // Assert
      expect(backMock).toHaveBeenCalled();
    });
  });
});
