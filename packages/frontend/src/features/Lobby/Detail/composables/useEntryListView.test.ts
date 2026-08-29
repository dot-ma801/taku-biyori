import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useEntryListView } from '@/features/Lobby/Detail/composables/useEntryListView';
import type { LobbyEntryModel } from '@/models/lobby';

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

describe('useEntryListView', () => {
  it('表示名とアバターの種を作る', () => {
    // Arrange
    const entries = ref<LobbyEntryModel[]>([makeEntry()]);

    // Act
    const { displayEntries } = useEntryListView(() => entries.value);

    // Assert
    expect(displayEntries.value[0]).toMatchObject({
      id: 'entry-1',
      userName: 'あさひ',
      userId: 'user-1',
      baseName: 'あさひ',
    });
  });

  it('ゲストの表示名には（ゲスト）が付く', () => {
    // Arrange
    const entries = ref<LobbyEntryModel[]>([
      makeEntry({ userId: null, userName: null, guestName: 'そら' }),
    ]);

    // Act
    const { displayEntries } = useEntryListView(() => entries.value);

    // Assert — アバターの種はサフィックス無しの baseName を使う
    expect(displayEntries.value[0]?.userName).toBe('そら（ゲスト）');
    expect(displayEntries.value[0]?.baseName).toBe('そら');
  });

  it('在籍中の参加者は hasLeft が false', () => {
    // Arrange
    const entries = ref<LobbyEntryModel[]>([makeEntry()]);

    // Act
    const { displayEntries } = useEntryListView(() => entries.value);

    // Assert
    expect(displayEntries.value[0]?.hasLeft).toBe(false);
  });

  it('脱退した参加者は hasLeft が true（グレー表示の判定に使う）', () => {
    // Arrange
    const entries = ref<LobbyEntryModel[]>([
      makeEntry({ leftAt: new Date('2026-08-10T00:00:00Z') }),
    ]);

    // Act
    const { displayEntries } = useEntryListView(() => entries.value);

    // Assert
    expect(displayEntries.value[0]?.hasLeft).toBe(true);
  });

  it('脱退者も一覧から取り除かない（並び順もそのまま）', () => {
    // Arrange — 参加者一覧だけは脱退者を表示する（design-v2 §9-5）
    const entries = ref<LobbyEntryModel[]>([
      makeEntry({ id: 'a' }),
      makeEntry({ id: 'b', leftAt: new Date('2026-08-10T00:00:00Z') }),
      makeEntry({ id: 'c' }),
    ]);

    // Act
    const { displayEntries } = useEntryListView(() => entries.value);

    // Assert
    expect(displayEntries.value.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('entries の変化に追従する', () => {
    // Arrange
    const entries = ref<LobbyEntryModel[]>([makeEntry()]);
    const { displayEntries } = useEntryListView(() => entries.value);

    // Act
    entries.value = [makeEntry({ leftAt: new Date('2026-08-10T00:00:00Z') })];

    // Assert
    expect(displayEntries.value[0]?.hasLeft).toBe(true);
  });
});
