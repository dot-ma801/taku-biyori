import { describe, it, expect } from 'vitest';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import type { LobbyListItemModel } from '@/models/lobby';
import type { GameSessionListItemModel } from '@/models/game-session';
import { toTableCards } from '@/features/Table/toTableCards';
import { TableCardStatus } from '@/features/Table/tableCardStatus';

const MY_USER_ID = 'my-user-id';

const makeLobby = (
  overrides: Partial<LobbyListItemModel> = {},
): LobbyListItemModel => ({
  id: 'lobby-1',
  title: 'ロビーのタイトル',
  scenarioName: 'シナリオ名',
  status: LobbyStatus.open,
  publishedAt: new Date('2026-07-01T00:00:00.000Z'),
  openUntil: null,
  receptionClosedAt: null,
  maxPlayers: 4,
  entries: [],
  activeEntries: [],
  hostUserId: MY_USER_ID,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  ...overrides,
});

const makeSession = (
  overrides: Partial<GameSessionListItemModel> = {},
): GameSessionListItemModel => ({
  id: 'session-1',
  lobbyId: 'lobby-1',
  title: '開催のタイトル',
  scenarioName: '開催のシナリオ名',
  timeLabel: null,
  status: GameSessionStatus.scheduled,
  scheduledAt: '2026-08-01',
  seatCount: 0,
  seatUserIds: [],
  hostUserId: MY_USER_ID,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  ...overrides,
});

const makeEntry = (userId: string, leftAt: Date | null = null) => ({
  id: `entry-${userId}`,
  userId,
  userName: userId,
  guestName: null,
  joinedAt: new Date('2026-07-01T00:00:00.000Z'),
  leftAt,
});

describe('toTableCards', () => {
  describe('卓の状態の解決', () => {
    it('下書きのロビーは draft になる', () => {
      // Arrange
      const lobbies = [makeLobby({ status: LobbyStatus.draft })];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.status).toBe(TableCardStatus.draft);
    });

    it('受付中で開催が無いロビーは recruiting（募集中）になる', () => {
      // Arrange
      const lobbies = [makeLobby({ status: LobbyStatus.open })];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.status).toBe(TableCardStatus.recruiting);
    });

    it('受付終了で開催が無いロビーは adjusting（調整中）になる', () => {
      // Arrange
      const lobbies = [makeLobby({ status: LobbyStatus.closed })];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.status).toBe(TableCardStatus.adjusting);
    });

    it.each([GameSessionStatus.scheduled, GameSessionStatus.today])(
      '開催が "%s" なら scheduled（開催予定）になる',
      (status) => {
        // Arrange
        const lobbies = [makeLobby({ status: LobbyStatus.closed })];
        const sessions = [makeSession({ status })];

        // Act
        const cards = toTableCards(lobbies, sessions, MY_USER_ID);

        // Assert
        expect(cards[0]?.status).toBe(TableCardStatus.scheduled);
      },
    );

    it('完了した開催しか無ければ completed（完了）になる', () => {
      // Arrange
      const lobbies = [makeLobby({ status: LobbyStatus.closed })];
      const sessions = [makeSession({ status: GameSessionStatus.completed })];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards[0]?.status).toBe(TableCardStatus.completed);
    });

    it('解散したロビーは、開催があっても cancelled（中止）になる', () => {
      // Arrange
      const lobbies = [makeLobby({ status: LobbyStatus.disbanded })];
      const sessions = [makeSession({ status: GameSessionStatus.scheduled })];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards[0]?.status).toBe(TableCardStatus.cancelled);
      expect(cards[0]?.gameSessionId).toBeNull();
    });

    it('中止された開催しか無い卓は、ロビーの受付状態まで戻る', () => {
      // Arrange
      const lobbies = [makeLobby({ status: LobbyStatus.closed })];
      const sessions = [makeSession({ status: GameSessionStatus.cancelled })];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards[0]?.status).toBe(TableCardStatus.adjusting);
      expect(cards[0]?.gameSessionId).toBeNull();
    });
  });

  describe('1つのロビーに複数の開催があるとき', () => {
    it('進行中の開催があれば、完了した開催より優先される', () => {
      // Arrange
      const lobbies = [makeLobby()];
      const sessions = [
        makeSession({
          id: 'done',
          status: GameSessionStatus.completed,
          scheduledAt: '2026-07-01',
        }),
        makeSession({
          id: 'next',
          status: GameSessionStatus.scheduled,
          scheduledAt: '2026-09-01',
        }),
      ];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards).toHaveLength(1);
      expect(cards[0]?.status).toBe(TableCardStatus.scheduled);
      expect(cards[0]?.gameSessionId).toBe('next');
    });

    it('進行中の開催が複数あれば、開催日がいちばん新しいものを代表にする', () => {
      // Arrange
      const lobbies = [makeLobby()];
      const sessions = [
        makeSession({ id: 'older', scheduledAt: '2026-08-01' }),
        makeSession({ id: 'newer', scheduledAt: '2026-09-01' }),
      ];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards[0]?.gameSessionId).toBe('newer');
    });

    it('開催日が同じなら、後から作られたほうを代表にする', () => {
      // Arrange
      const lobbies = [makeLobby()];
      const sessions = [
        makeSession({
          id: 'first',
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
        }),
        makeSession({
          id: 'second',
          createdAt: new Date('2026-07-02T00:00:00.000Z'),
        }),
      ];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards[0]?.gameSessionId).toBe('second');
    });

    it('カードはロビー1件につき1枚しか作らない', () => {
      // Arrange
      const lobbies = [makeLobby()];
      const sessions = [
        makeSession({ id: 'a', scheduledAt: '2026-08-01' }),
        makeSession({ id: 'b', scheduledAt: '2026-09-01' }),
        makeSession({ id: 'c', scheduledAt: '2026-10-01' }),
      ];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards).toHaveLength(1);
    });
  });

  describe('突き合わせ', () => {
    it('開催は lobbyId が一致するロビーにだけ効く', () => {
      // Arrange
      const lobbies = [
        makeLobby({ id: 'lobby-1' }),
        makeLobby({ id: 'lobby-2' }),
      ];
      const sessions = [makeSession({ lobbyId: 'lobby-2' })];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      const byId = new Map(cards.map((c) => [c.lobbyId, c]));
      expect(byId.get('lobby-1')?.status).toBe(TableCardStatus.recruiting);
      expect(byId.get('lobby-2')?.status).toBe(TableCardStatus.scheduled);
    });

    it('どのロビーにも紐づかない開催は無視される', () => {
      // Arrange
      const lobbies = [makeLobby({ id: 'lobby-1' })];
      const sessions = [makeSession({ lobbyId: 'unknown-lobby' })];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards).toHaveLength(1);
      expect(cards[0]?.status).toBe(TableCardStatus.recruiting);
    });
  });

  describe('表示値', () => {
    it('開催があるときは開催の解決済みタイトル・シナリオ名を使う', () => {
      // Arrange
      const lobbies = [
        makeLobby({ title: 'ロビー名', scenarioName: 'ロビー側' }),
      ];
      const sessions = [
        makeSession({ title: '開催名', scenarioName: '開催側' }),
      ];

      // Act
      const cards = toTableCards(lobbies, sessions, MY_USER_ID);

      // Assert
      expect(cards[0]?.title).toBe('開催名');
      expect(cards[0]?.scenarioName).toBe('開催側');
    });

    it('開催が無いときはロビーのタイトル・シナリオ名を使う', () => {
      // Arrange
      const lobbies = [
        makeLobby({ title: 'ロビー名', scenarioName: 'ロビー側' }),
      ];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.title).toBe('ロビー名');
      expect(cards[0]?.scenarioName).toBe('ロビー側');
    });

    it('在籍中の参加者だけを人数に数える', () => {
      // Arrange
      const activeEntries = [makeEntry('a'), makeEntry('b')];
      const lobbies = [
        makeLobby({
          entries: [
            ...activeEntries,
            makeEntry('c', new Date('2026-07-05T00:00:00.000Z')),
          ],
          activeEntries,
        }),
      ];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.memberCount).toBe(2);
    });

    it('定員から在籍数を引いた残り枠を持つ', () => {
      // Arrange
      const activeEntries = [makeEntry('a')];
      const lobbies = [
        makeLobby({ maxPlayers: 4, entries: activeEntries, activeEntries }),
      ];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.remainingCount).toBe(3);
    });

    it('定員が未設定なら残り枠は null になる', () => {
      // Arrange
      const lobbies = [makeLobby({ maxPlayers: null })];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.remainingCount).toBeNull();
      expect(cards[0]?.maxPlayers).toBeNull();
    });

    it('在籍数が定員を上回っても残り枠は負にならない', () => {
      // Arrange
      const activeEntries = [makeEntry('a'), makeEntry('b'), makeEntry('c')];
      const lobbies = [
        makeLobby({ maxPlayers: 2, entries: activeEntries, activeEntries }),
      ];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.remainingCount).toBe(0);
    });
  });

  describe('ホスト判定', () => {
    it('ホストの userId が自分と一致すれば isHost が true になる', () => {
      // Arrange
      const lobbies = [makeLobby({ hostUserId: MY_USER_ID })];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.isHost).toBe(true);
    });

    it('他人がホストなら isHost が false になる', () => {
      // Arrange
      const lobbies = [makeLobby({ hostUserId: 'someone-else' })];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards[0]?.isHost).toBe(false);
    });

    it('未ログイン（myUserId が null）なら isHost は false になる', () => {
      // Arrange
      const lobbies = [makeLobby({ hostUserId: MY_USER_ID })];

      // Act
      const cards = toTableCards(lobbies, [], null);

      // Assert
      expect(cards[0]?.isHost).toBe(false);
    });
  });

  describe('並び順', () => {
    it('更新が新しい卓から並ぶ', () => {
      // Arrange
      const lobbies = [
        makeLobby({
          id: 'old',
          updatedAt: new Date('2026-07-01T00:00:00.000Z'),
        }),
        makeLobby({
          id: 'new',
          updatedAt: new Date('2026-07-10T00:00:00.000Z'),
        }),
      ];

      // Act
      const cards = toTableCards(lobbies, [], MY_USER_ID);

      // Assert
      expect(cards.map((c) => c.lobbyId)).toEqual(['new', 'old']);
    });
  });

  describe('空の入力', () => {
    it('ロビーが無ければ空配列を返す', () => {
      // Arrange & Act
      const cards = toTableCards([], [makeSession()], MY_USER_ID);

      // Assert
      expect(cards).toEqual([]);
    });
  });
});
