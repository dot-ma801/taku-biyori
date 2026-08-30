import { describe, expect, it } from 'vitest';
import { LobbyStatus } from '@taku-biyori/shared';
import type { Lobby, LobbyDetail, LobbyListItem } from '@taku-biyori/shared';
import {
  toLobbyDetailModel,
  toLobbyEntryModel,
  toLobbyListItemModel,
  toLobbyModel,
} from '@/models/lobby';

const lobbyDto: Lobby = {
  id: '11111111-1111-1111-1111-111111111111',
  title: '蒼き月の夜卓',
  description: '初心者歓迎',
  scenarioName: '青い月',
  location: 'オンライン',
  status: LobbyStatus.open,
  isPublished: true,
  maxPlayers: 4,
  openUntil: '2026-12-31',
  cancelledAt: null,
  hostUserId: 'user-host',
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T11:00:00.000Z',
};

const memberDto = {
  id: '22222222-2222-2222-2222-222222222222',
  userId: 'user-a',
  userName: 'あさひ',
  guestName: null,
  joinedAt: '2026-08-03T12:00:00.000Z',
};

describe('toLobbyEntryModel', () => {
  it('joinedAt を Date に変換する', () => {
    // Arrange / Act
    const model = toLobbyEntryModel(memberDto);

    // Assert
    expect(model.joinedAt).toEqual(new Date('2026-08-03T12:00:00.000Z'));
  });

  it('id・表示名まわりの値をそのまま引き継ぐ', () => {
    // Arrange / Act
    const model = toLobbyEntryModel(memberDto);

    // Assert
    expect(model).toMatchObject({
      id: memberDto.id,
      userId: 'user-a',
      userName: 'あさひ',
      guestName: null,
    });
  });

  it('ゲストは userId が null・guestName が入る', () => {
    // Arrange
    const guest = {
      ...memberDto,
      userId: null,
      userName: null,
      guestName: 'ゲストA',
    };

    // Act
    const model = toLobbyEntryModel(guest);

    // Assert
    expect(model).toMatchObject({ userId: null, guestName: 'ゲストA' });
  });

  it('leftAt は在籍中なら null', () => {
    // Arrange / Act
    const model = toLobbyEntryModel(memberDto);

    // Assert
    expect(model.leftAt).toBeNull();
  });
});

describe('toLobbyModel', () => {
  it('createdAt / updatedAt を Date に変換する', () => {
    // Arrange / Act
    const model = toLobbyModel(lobbyDto);

    // Assert
    expect(model.createdAt).toEqual(new Date('2026-08-01T10:00:00.000Z'));
    expect(model.updatedAt).toEqual(new Date('2026-08-02T11:00:00.000Z'));
  });

  it('openUntil は日付（YYYY-MM-DD）なので文字列のまま持つ', () => {
    // Arrange / Act
    const model = toLobbyModel(lobbyDto);

    // Assert — Date にするとタイムゾーンで日付がずれるため変換しない
    expect(model.openUntil).toBe('2026-12-31');
  });

  it('省略されうるフィールドは null に正規化する', () => {
    // Arrange — DTO は undefined を取りうるが model は null に揃える
    const dto: Lobby = {
      id: lobbyDto.id,
      title: lobbyDto.title,
      status: LobbyStatus.draft,
      isPublished: false,
      hostUserId: 'user-host',
      createdAt: lobbyDto.createdAt,
      updatedAt: lobbyDto.updatedAt,
    };

    // Act
    const model = toLobbyModel(dto);

    // Assert
    expect(model).toMatchObject({
      description: null,
      scenarioName: null,
      location: null,
      maxPlayers: null,
      openUntil: null,
    });
  });

  it('ステータスとホストをそのまま引き継ぐ', () => {
    // Arrange / Act
    const model = toLobbyModel(lobbyDto);

    // Assert
    expect(model.status).toBe(LobbyStatus.open);
    expect(model.hostUserId).toBe('user-host');
  });
});

describe('toLobbyDetailModel', () => {
  const detailDto: LobbyDetail = { ...lobbyDto, members: [memberDto] };

  it('members を entries に移し替える', () => {
    // Arrange / Act
    const model = toLobbyDetailModel(detailDto);

    // Assert
    expect(model.entries).toHaveLength(1);
    expect(model.entries[0]?.id).toBe(memberDto.id);
  });

  it('activeEntries は leftAt が null のものだけを含む', () => {
    // Arrange — 脱退済みの参加者が混ざったロビー
    const left = {
      ...memberDto,
      id: '33333333-3333-3333-3333-333333333333',
      leftAt: '2026-08-10T00:00:00.000Z',
    };
    const dto: LobbyDetail = { ...detailDto, members: [memberDto, left] };

    // Act
    const model = toLobbyDetailModel(dto);

    // Assert — 参加者一覧は全件、回答表・着席候補は activeEntries を使う
    expect(model.entries).toHaveLength(2);
    expect(model.activeEntries).toHaveLength(1);
    expect(model.activeEntries[0]?.id).toBe(memberDto.id);
  });

  it('ロビー本体のフィールドも引き継ぐ', () => {
    // Arrange / Act
    const model = toLobbyDetailModel(detailDto);

    // Assert
    expect(model.title).toBe('蒼き月の夜卓');
    expect(model.createdAt).toEqual(new Date('2026-08-01T10:00:00.000Z'));
  });
});

describe('toLobbyListItemModel', () => {
  const listItemDto: LobbyListItem = {
    id: lobbyDto.id,
    title: '蒼き月の夜卓',
    scenarioName: '青い月',
    status: LobbyStatus.open,
    isPublished: true,
    openUntil: '2026-12-31',
    memberCount: 3,
    maxPlayers: 4,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
    role: 'host',
  };

  it('createdAt / updatedAt を Date に変換する', () => {
    // Arrange / Act
    const model = toLobbyListItemModel(listItemDto);

    // Assert
    expect(model.createdAt).toEqual(new Date('2026-08-01T10:00:00.000Z'));
    expect(model.updatedAt).toEqual(new Date('2026-08-02T11:00:00.000Z'));
  });

  it('参加者数・ロール・定員を引き継ぐ', () => {
    // Arrange / Act
    const model = toLobbyListItemModel(listItemDto);

    // Assert
    expect(model).toMatchObject({
      memberCount: 3,
      maxPlayers: 4,
      role: 'host',
    });
  });

  it('未参加のロビーは role が null', () => {
    // Arrange
    const dto: LobbyListItem = { ...listItemDto, role: null };

    // Act
    const model = toLobbyListItemModel(dto);

    // Assert
    expect(model.role).toBeNull();
  });

  it('省略されうるフィールドは null に正規化する', () => {
    // Arrange
    const dto: LobbyListItem = {
      id: lobbyDto.id,
      title: '蒼き月の夜卓',
      status: LobbyStatus.draft,
      isPublished: false,
      memberCount: 1,
      createdAt: listItemDto.createdAt,
      updatedAt: listItemDto.updatedAt,
      role: 'host',
    };

    // Act
    const model = toLobbyListItemModel(dto);

    // Assert
    expect(model).toMatchObject({
      scenarioName: null,
      openUntil: null,
      maxPlayers: null,
    });
  });
});
