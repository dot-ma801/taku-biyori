import { describe, expect, it } from 'vitest';
import type {
  GameSession,
  GameSessionDetail,
  GameSessionListItem,
  Seat,
} from '@taku-biyori/shared';
import { GameSessionStatus, LobbyStatus } from '@taku-biyori/shared';
import {
  toGameSessionDetailModel,
  toGameSessionListItemModel,
  toGameSessionModel,
  toSeatModel,
} from '@/models/game-session';

const LOBBY_ID = '00000000-0000-4000-8000-00000000aaaa';
const SESSION_ID = '00000000-0000-4000-8000-00000000bbbb';

const lobby: GameSession['lobby'] = {
  id: LOBBY_ID,
  title: 'マダミス「蒼き月」',
  scenarioName: '蒼き月の夜',
  location: 'オンライン',
  maxPlayers: 6,
  hostUserId: 'user-host',
  status: LobbyStatus.open,
};

const dto = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: SESSION_ID,
  lobbyId: LOBBY_ID,
  scheduledAt: '2999-12-31',
  status: GameSessionStatus.scheduled,
  description: null,
  overrides: {
    title: null,
    scenarioName: null,
    location: null,
    timeLabel: null,
  },
  lobby,
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  ...overrides,
});

describe('toGameSessionModel', () => {
  it('上書きが無ければロビーの値が表示値になる', () => {
    // Arrange
    const input = dto();

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.title).toBe('マダミス「蒼き月」');
    expect(model.scenarioName).toBe('蒼き月の夜');
    expect(model.location).toBe('オンライン');
  });

  it('上書きがあればそちらが表示値になる', () => {
    // Arrange
    const input = dto({
      overrides: {
        title: '第2回',
        scenarioName: '別シナリオ',
        location: 'カフェ〇〇',
        timeLabel: '13:00〜',
      },
    });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.title).toBe('第2回');
    expect(model.scenarioName).toBe('別シナリオ');
    expect(model.location).toBe('カフェ〇〇');
    expect(model.timeLabel).toBe('13:00〜');
  });

  it('overrides の生値を別フィールドで残す', () => {
    // Arrange
    // 捨てると「ロビーと同じ値」と「明示的な上書き」が区別できなくなり、
    // 編集フォームが意図しない上書きを発生させる（design-v2 §5-5）
    const input = dto({
      overrides: {
        title: null,
        scenarioName: null,
        location: 'カフェ〇〇',
        timeLabel: null,
      },
    });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.overrides).toEqual({
      title: null,
      scenarioName: null,
      location: 'カフェ〇〇',
      timeLabel: null,
    });
    // 表示値は解決済みでも、生値は null のまま残る
    expect(model.title).toBe('マダミス「蒼き月」');
    expect(model.overrides.title).toBeNull();
  });

  it('ロビーに既定値が無い項目は null になる（表示用の文言は入れない）', () => {
    // Arrange
    const input = dto({
      lobby: { ...lobby, scenarioName: null, location: null },
    });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.scenarioName).toBeNull();
    expect(model.location).toBeNull();
  });

  it('timeLabel はロビーに既定値が無いので生値がそのまま表示値になる', () => {
    // Arrange
    const input = dto({
      overrides: {
        title: null,
        scenarioName: null,
        location: null,
        timeLabel: '午後',
      },
    });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.timeLabel).toBe('午後');
  });

  it('status をファクトから導出し直す', () => {
    // Arrange
    // レスポンスの status を信じず自前で導出するので、日付をまたいでも正しく出る
    const input = dto({
      status: GameSessionStatus.scheduled,
      cancelledAt: '2026-08-20T00:00:00.000Z',
    });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.status).toBe(GameSessionStatus.cancelled);
  });

  it('開催日が今日なら today になる', () => {
    // Arrange
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const input = dto({ scheduledAt: today });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.status).toBe(GameSessionStatus.today);
  });

  it('タイムスタンプは Date にするが、開催日は文字列のまま持つ', () => {
    // Arrange
    // scheduledAt は日付のみの値。Date にするとタイムゾーンで日付がずれる（CLAUDE.md）
    const input = dto({ completedAt: '2026-08-20T00:00:00.000Z' });

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.scheduledAt).toBe('2999-12-31');
    expect(model.createdAt).toBeInstanceOf(Date);
    expect(model.updatedAt).toBeInstanceOf(Date);
    expect(model.completedAt).toBeInstanceOf(Date);
    expect(model.cancelledAt).toBeNull();
  });

  it('ロビーの情報を model として持つ', () => {
    // Arrange
    const input = dto();

    // Act
    const model = toGameSessionModel(input);

    // Assert
    expect(model.lobby).toEqual({
      id: LOBBY_ID,
      title: 'マダミス「蒼き月」',
      scenarioName: '蒼き月の夜',
      location: 'オンライン',
      maxPlayers: 6,
      hostUserId: 'user-host',
      status: LobbyStatus.open,
    });
  });
});

describe('toSeatModel', () => {
  const seat: Seat = {
    id: 'seat-1',
    entryId: 'entry-1',
    userId: 'user-2',
    userName: 'たくみ',
    guestName: null,
    characterName: 'アルベルト',
    seatedAt: '2026-08-30T10:00:00.000Z',
  };

  it('seatedAt を Date にする', () => {
    // Arrange / Act
    const model = toSeatModel(seat);

    // Assert
    expect(model.seatedAt).toBeInstanceOf(Date);
    expect(model.seatedAt.toISOString()).toBe('2026-08-30T10:00:00.000Z');
  });

  it('ログインユーザーとゲストを isGuest で区別できる', () => {
    // Arrange
    const guest: Seat = {
      ...seat,
      userId: null,
      userName: null,
      guestName: 'ゲストA',
    };

    // Act / Assert
    expect(toSeatModel(seat).isGuest).toBe(false);
    expect(toSeatModel(guest).isGuest).toBe(true);
  });

  it('キャラクター名が未割り当てなら null のままにする', () => {
    // Arrange / Act
    const model = toSeatModel({ ...seat, characterName: null });

    // Assert
    expect(model.characterName).toBeNull();
  });
});

describe('toGameSessionDetailModel', () => {
  it('着席を model に変換して持つ', () => {
    // Arrange
    const detail: GameSessionDetail = {
      ...dto(),
      seats: [
        {
          id: 'seat-1',
          entryId: 'entry-1',
          userId: 'user-2',
          userName: 'たくみ',
          guestName: null,
          characterName: null,
          seatedAt: '2026-08-30T10:00:00.000Z',
        },
      ],
    };

    // Act
    const model = toGameSessionDetailModel(detail);

    // Assert
    expect(model.seats).toHaveLength(1);
    expect(model.seats[0]?.seatedAt).toBeInstanceOf(Date);
    // セッション本体の解決も効いている
    expect(model.title).toBe('マダミス「蒼き月」');
  });

  it('着席が0件でも空配列になる', () => {
    // Arrange
    const detail: GameSessionDetail = { ...dto(), seats: [] };

    // Act
    const model = toGameSessionDetailModel(detail);

    // Assert
    expect(model.seats).toEqual([]);
  });
});

describe('toGameSessionListItemModel', () => {
  const listDto: GameSessionListItem = {
    id: SESSION_ID,
    lobbyId: LOBBY_ID,
    title: 'マダミス「蒼き月」',
    scenarioName: '蒼き月の夜',
    status: GameSessionStatus.scheduled,
    scheduledAt: '2999-12-31',
    timeLabel: null,
    seats: [
      { id: 'seat-1', userId: 'user-2' },
      { id: 'seat-2', userId: null },
    ],
    hostUserId: 'user-host',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  };

  it('一覧はサーバが解決済みの表示値をそのまま使う', () => {
    // Arrange / Act
    const model = toGameSessionListItemModel(listDto);

    // Assert
    // 一覧の契約には overrides も lobby も無い（design-v2 §5-5）
    expect(model.title).toBe('マダミス「蒼き月」');
    expect(model.scenarioName).toBe('蒼き月の夜');
  });

  it('status をファクトから導出し直す', () => {
    // Arrange
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Act
    const model = toGameSessionListItemModel({
      ...listDto,
      scheduledAt: today,
      status: GameSessionStatus.scheduled,
    });

    // Assert
    expect(model.status).toBe(GameSessionStatus.today);
  });

  it('着席数と自分が着席しているかを導出して持つ', () => {
    // Arrange / Act
    const model = toGameSessionListItemModel(listDto);

    // Assert
    expect(model.seatCount).toBe(2);
    expect(model.seatUserIds).toEqual(['user-2']);
  });

  it('タイムスタンプは Date、開催日は文字列のままにする', () => {
    // Arrange / Act
    const model = toGameSessionListItemModel(listDto);

    // Assert
    expect(model.scheduledAt).toBe('2999-12-31');
    expect(model.createdAt).toBeInstanceOf(Date);
  });
});
