import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { useLobbyListItemView } from '@/features/Lobby/List/useLobbyListItemView';
import type { LobbyEntryModel, LobbyListItemModel } from '@/models/lobby';

const makeEntry = (
  overrides: Partial<LobbyEntryModel> = {},
): LobbyEntryModel => ({
  id: 'entry-1',
  userId: 'user-1',
  userName: 'あさひ',
  guestName: null,
  joinedAt: new Date('2026-08-01T00:00:00Z'),
  leftAt: null,
  ...overrides,
});

const makeLobby = (
  overrides: Partial<LobbyListItemModel> = {},
): LobbyListItemModel => ({
  id: 'lobby-1',
  title: 'クトゥルフ卓',
  scenarioName: null,
  status: LobbyStatus.open,
  publishedAt: new Date('2026-08-01T00:00:00Z'),
  openUntil: null,
  receptionClosedAt: null,
  maxPlayers: 4,
  entries: [makeEntry()],
  activeEntries: [makeEntry()],
  hostUserId: 'user-host',
  createdAt: new Date('2026-08-01T00:00:00Z'),
  updatedAt: new Date('2026-08-01T00:00:00Z'),
  ...overrides,
});

describe('useLobbyListItemView', () => {
  it('在籍中の人数を activeEntryCount にする', () => {
    // Arrange
    const entries = [
      makeEntry({ id: 'a' }),
      makeEntry({ id: 'b' }),
      makeEntry({ id: 'c' }),
    ];
    const lobbies = ref([
      makeLobby({ entries, activeEntries: entries.slice(0, 2) }),
    ]);

    // Act
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Assert — 脱退者は数えない
    expect(items.value[0]?.activeEntryCount).toBe(2);
  });

  it('maxPlayers が未設定なら表示用の定員は - になる', () => {
    // Arrange
    const lobbies = ref([makeLobby({ maxPlayers: null })]);

    // Act
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Assert
    expect(items.value[0]?.formattedMaxPlayers).toBe('-');
  });

  it('maxPlayers があれば残り枠を出す', () => {
    // Arrange
    const entries = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
    const lobbies = ref([
      makeLobby({ maxPlayers: 5, entries, activeEntries: entries }),
    ]);

    // Act
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Assert
    expect(items.value[0]?.remainingCount).toBe(3);
  });

  it('maxPlayers が未設定なら残り枠は null（表示しない）', () => {
    // Arrange
    const lobbies = ref([makeLobby({ maxPlayers: null })]);

    // Act
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Assert
    expect(items.value[0]?.remainingCount).toBeNull();
  });

  it('定員を超えていても残り枠は 0 で下げ止まる', () => {
    // Arrange — 定員を下げた後など、在籍数が定員を上回りうる
    const entries = [
      makeEntry({ id: 'a' }),
      makeEntry({ id: 'b' }),
      makeEntry({ id: 'c' }),
    ];
    const lobbies = ref([
      makeLobby({ maxPlayers: 2, entries, activeEntries: entries }),
    ]);

    // Act
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Assert
    expect(items.value[0]?.remainingCount).toBe(0);
  });

  it('もとのロビーの値はそのまま引き継ぐ', () => {
    // Arrange
    const lobbies = ref([makeLobby({ title: '狂気山脈' })]);

    // Act
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Assert
    expect(items.value[0]).toMatchObject({
      id: 'lobby-1',
      title: '狂気山脈',
      status: LobbyStatus.open,
    });
  });

  it('ロビーの変化に追従する', () => {
    // Arrange
    const lobbies = ref<LobbyListItemModel[]>([makeLobby()]);
    const { items } = useLobbyListItemView(() => lobbies.value);

    // Act
    lobbies.value = [makeLobby({ activeEntries: [] })];

    // Assert
    expect(items.value[0]?.activeEntryCount).toBe(0);
  });
});
