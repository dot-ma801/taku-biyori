import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { useCreateLobby } from '@/features/Lobby/Edit/composables/useCreateLobby';
import type { LobbyModel } from '@/models/lobby';
import { LobbyStatus } from '@taku-biyori/shared';

vi.mock('@/api/lobby', () => ({
  createLobby: vi.fn(),
  getLobby: vi.fn(),
}));

vi.mock('@/api/game-session', () => ({
  createGameSession: vi.fn(),
}));

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: pushMock, back: backMock })),
}));

import { createLobby, getLobby } from '@/api/lobby';
import { createGameSession } from '@/api/game-session';
import type { LobbyDetailModel } from '@/models/lobby';

const mockLobby: LobbyModel = {
  id: 'lobby-1',
  title: 'テスト募集枠',
  description: null,
  scenarioName: null,
  location: null,
  status: LobbyStatus.draft,
  maxPlayers: null,
  publishedAt: null,
  openUntil: null,
  receptionClosedAt: null,
  disbandedAt: null,
  hostUserId: 'user-1',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
};

const HOST_ENTRY_ID = 'entry-host';

const mockLobbyDetail: LobbyDetailModel = {
  ...mockLobby,
  entries: [],
  activeEntries: [
    {
      id: HOST_ENTRY_ID,
      userId: 'user-1',
      userName: 'ホスト',
      guestName: null,
      joinedAt: new Date('2025-01-01T00:00:00.000Z'),
      leftAt: null,
    },
  ],
  schedulePolls: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createLobby).mockResolvedValue(mockLobby);
  vi.mocked(getLobby).mockResolvedValue(mockLobbyDetail);
  vi.mocked(createGameSession).mockResolvedValue({
    id: 'game-session-1',
  } as never);
});

describe('useCreateLobby', () => {
  describe('候補日のバリデーション', () => {
    // 候補日の編集はロビー編集画面から外れたため、作成時点では0件を許容する
    it('候補日が0件でも送信できる', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [];

      // Act
      await submit();

      // Assert
      expect(errorMessages.value).toEqual([]);
      expect(createLobby).toHaveBeenCalledWith(
        expect.objectContaining({ candidateDates: [] }),
      );
    });

    // blur 時の rules は送信をブロックしないので、送信側でも同じ基準で弾く
    it('ひとことが上限を超えていたら送信をブロックする', async () => {
      // Arrange
      const { title, pendingDates, errorMessages, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [
        { date: '2025-05-01', timeLabel: 'あ'.repeat(21) },
        { date: '2025-05-02', timeLabel: '午後から' },
      ];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual([
        '5/1（木）のひとことは20文字以内で入力してください',
      ]);
    });

    it('候補日が1件以上あれば candidateDates として送信する', async () => {
      // Arrange
      const { title, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [
        { date: '2025-05-01', timeLabel: '' },
        { date: '2025-05-02', timeLabel: '' },
      ];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateDates: [
            { date: '2025-05-01', timeLabel: null },
            { date: '2025-05-02', timeLabel: null },
          ],
        }),
      );
    });

    it('候補日ごとのひとことを正規化して送信する', async () => {
      // Arrange
      const { title, pendingDates, submit } = useCreateLobby();
      title.value = '募集枠';
      pendingDates.value = [
        { date: '2025-05-01', timeLabel: '  13:00〜17:00  ' },
        { date: '2025-05-02', timeLabel: '' },
      ];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith(
        expect.objectContaining({
          candidateDates: [
            { date: '2025-05-01', timeLabel: '13:00〜17:00' },
            { date: '2025-05-02', timeLabel: null },
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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual(['タイトルを入力してください']);
    });
  });

  describe('複数のバリデーションエラー', () => {
    it('タイトル未入力かつ募集人数が範囲外のとき、両方のエラーメッセージを表示する', async () => {
      // Arrange
      const { title, maxMembers, pendingDates, errorMessages, submit } =
        useCreateLobby();
      title.value = '';
      maxMembers.value = '1';
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

      // Act
      await submit();

      // Assert
      expect(createLobby).not.toHaveBeenCalled();
      expect(errorMessages.value).toEqual([
        'タイトルを入力してください',
        '募集人数は2〜20人の範囲で入力してください',
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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

      // Act
      await submit();

      // Assert
      expect(createLobby).toHaveBeenCalledWith({
        title: '募集枠',
        candidateDates: [{ date: '2025-05-01', timeLabel: null }],
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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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
      title.value = '';
      pendingDates.value = [];
      await submit();
      expect(errorMessages.value).not.toEqual([]);

      // Act
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];
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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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
      pendingDates.value = [{ date: '2025-05-01', timeLabel: '' }];

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

describe('useCreateLobby（日程が決まっているモード）', () => {
  it('開催日が未入力なら送信をブロックする', async () => {
    // Arrange
    const { title, scheduleMode, errorMessages, submit } = useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';

    // Act
    await submit();

    // Assert
    expect(errorMessages.value).toContain('開催日を入力してください');
    expect(createLobby).not.toHaveBeenCalled();
  });

  it('候補日を送らずにロビーを作る', async () => {
    // Arrange
    const { title, scheduleMode, scheduledAt, pendingDates, submit } =
      useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';
    pendingDates.value = [{ date: '2099-10-01', timeLabel: '' }];

    // Act
    await submit();

    // Assert
    expect(createLobby).toHaveBeenCalledWith(
      expect.objectContaining({ candidateDates: [] }),
    );
  });

  it('ホストを着席者にして開催を1件つくる', async () => {
    // Arrange
    const { title, scheduleMode, scheduledAt, timeLabel, submit } =
      useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';
    timeLabel.value = '19:00〜';

    // Act
    await submit();

    // Assert
    expect(createGameSession).toHaveBeenCalledWith('lobby-1', {
      scheduledAt: '2099-09-01',
      entryIds: [HOST_ENTRY_ID],
      timeLabel: '19:00〜',
    });
  });

  it('当日の連絡事項は開催に載せる（ロビーの説明とは別）', async () => {
    // Arrange
    const {
      title,
      scheduleMode,
      scheduledAt,
      description,
      gameSessionDescription,
      submit,
    } = useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';
    description.value = 'ロビーの説明';
    gameSessionDescription.value = '19時に駅前集合';

    // Act
    await submit();

    // Assert
    expect(createGameSession).toHaveBeenCalledWith(
      'lobby-1',
      expect.objectContaining({ description: '19時に駅前集合' }),
    );
    expect(createLobby).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'ロビーの説明' }),
    );
  });

  it('モードを切り替えたら作りかけのロビーは使い回さない', async () => {
    // Arrange
    vi.mocked(createGameSession).mockRejectedValueOnce(
      new Error('開催の作成に失敗'),
    );
    const { title, scheduleMode, scheduledAt, pendingDates, submit } =
      useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';

    // Act
    await submit();
    scheduleMode.value = 'poll';
    pendingDates.value = [{ date: '2099-10-01', timeLabel: '' }];
    await submit();

    // Assert
    expect(createLobby).toHaveBeenCalledTimes(2);
    expect(createLobby).toHaveBeenLastCalledWith(
      expect.objectContaining({
        candidateDates: [{ date: '2099-10-01', timeLabel: null }],
      }),
    );
  });

  it('作成後は開催の詳細へ遷移する', async () => {
    // Arrange
    const { title, scheduleMode, scheduledAt, submit } = useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';

    // Act
    await submit();

    // Assert
    expect(pushMock).toHaveBeenCalledWith({
      name: 'game-sessions-detail',
      params: { lobbyId: 'lobby-1', gameSessionId: 'game-session-1' },
    });
  });

  it('開催の作成に失敗しても再送信でロビーを作り直さない', async () => {
    // Arrange
    vi.mocked(createGameSession).mockRejectedValueOnce(
      new Error('開催の作成に失敗'),
    );
    const { title, scheduleMode, scheduledAt, submit } = useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';

    // Act
    await submit();
    await submit();

    // Assert
    expect(createLobby).toHaveBeenCalledOnce();
    expect(createGameSession).toHaveBeenCalledTimes(2);
  });

  it('ロビーに載る項目を編集したら作りかけのロビーを使い回さない', async () => {
    // Arrange
    vi.mocked(createGameSession).mockRejectedValueOnce(
      new Error('開催の作成に失敗'),
    );
    const { title, scheduleMode, scheduledAt, submit } = useCreateLobby();
    title.value = 'ロビー';
    scheduleMode.value = 'fixed';
    scheduledAt.value = '2099-09-01';

    // Act
    await submit();
    title.value = '直したロビー名';
    await submit();

    // Assert
    expect(createLobby).toHaveBeenCalledTimes(2);
    expect(createLobby).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: '直したロビー名' }),
    );
  });

  it('候補日モードならロビーの詳細へ遷移し開催は作らない', async () => {
    // Arrange
    const { title, submit } = useCreateLobby();
    title.value = 'ロビー';

    // Act
    await submit();

    // Assert
    expect(createGameSession).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith({
      name: 'lobbies-detail',
      params: { lobbyId: 'lobby-1' },
    });
  });
});
