import { describe, it, expect } from 'vitest';
import { ref } from 'vue';
import { usePlayMemoPane } from '@/features/GameSession/PlayMemo/usePlayMemoPane';
import type { MyPlayMemoModel } from '@/models/play-memo';
import type { PlayMemoMemberEntry } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';

const MY_MEMBER_ID = 'member-me';
const OTHER_MEMBER_ID = 'member-other';

function makeEntry(
  overrides: Partial<PlayMemoMemberEntry> = {},
): PlayMemoMemberEntry {
  return {
    seatId: OTHER_MEMBER_ID,
    primaryLabel: '青木',
    secondaryLabel: null,
    userId: 'user-other',
    avatarName: '青木',
    tag: 'private',
    readable: false,
    isMe: false,
    sharedPlayMemo: null,
    ...overrides,
  };
}

function makePlayMemo(
  overrides: Partial<MyPlayMemoModel> = {},
): MyPlayMemoModel {
  return {
    seatId: MY_MEMBER_ID,
    body: '書斎の鍵は青木さんが持っていた',
    sharedAt: null,
    updatedAt: new Date('2026-08-03T12:04:00Z'),
    ...overrides,
  };
}

function setup(overrides: {
  loadingMemo?: boolean;
  loadingSharedPlayMemos?: boolean;
  isMyMemo?: boolean;
  playMemo?: MyPlayMemoModel | null;
  canViewShared?: boolean;
  selectedEntry?: PlayMemoMemberEntry | null;
  isMineSelected?: boolean;
}) {
  const loadingMemo = ref(overrides.loadingMemo ?? false);
  const loadingSharedPlayMemos = ref(overrides.loadingSharedPlayMemos ?? false);
  const isMyMemo = ref(overrides.isMyMemo ?? true);
  const playMemo = ref<MyPlayMemoModel | null>(overrides.playMemo ?? null);
  const canViewShared = ref(overrides.canViewShared ?? false);
  const selectedEntry = ref<PlayMemoMemberEntry | null>(
    overrides.selectedEntry ?? null,
  );
  const isMineSelected = ref(overrides.isMineSelected ?? true);

  const result = usePlayMemoPane({
    loadingMemo,
    loadingSharedPlayMemos,
    isMyMemo,
    playMemo,
    canViewShared,
    selectedEntry,
    isMineSelected,
  });

  return {
    ...result,
    loadingMemo,
    loadingSharedPlayMemos,
    isMyMemo,
    playMemo,
    canViewShared,
    selectedEntry,
    isMineSelected,
  };
}

describe('showSidebar', () => {
  it('canViewShared が true なら出す', () => {
    // Arrange & Act
    const { showSidebar } = setup({ canViewShared: true });

    // Assert
    expect(showSidebar.value).toBe(true);
  });

  it('canViewShared が false なら出さない', () => {
    // Arrange & Act
    const { showSidebar } = setup({ canViewShared: false });

    // Assert
    expect(showSidebar.value).toBe(false);
  });
});

describe('自分の行（既定選択）: 読み込み境界', () => {
  it('本文がまだ届いていない間はエディタも失敗表示も出さない（① の指摘）', () => {
    // Arrange & Act: playMemo 到着前（loadingMemo === true）
    const { showEditor, showFailedNotice, readerEntry, showLoading } = setup({
      isMineSelected: true,
      loadingMemo: true,
      playMemo: null,
    });

    // Assert: 「このメモには本文がありません」のような断定表示を出さず、
    // ローディングに倒す
    expect(showEditor.value).toBe(false);
    expect(showFailedNotice.value).toBe(false);
    expect(readerEntry.value).toBeNull();
    expect(showLoading.value).toBe(true);
  });

  it('本文が届けばエディタを出す', () => {
    // Arrange & Act
    const { showEditor, showFailedNotice, showLoading } = setup({
      isMineSelected: true,
      loadingMemo: false,
      playMemo: makePlayMemo(),
    });

    // Assert
    expect(showEditor.value).toBe(true);
    expect(showFailedNotice.value).toBe(false);
    expect(showLoading.value).toBe(false);
  });

  it('読み込みが終わっても playMemo が null なら失敗表示に確定する', () => {
    // Arrange & Act
    const { showEditor, showFailedNotice, showLoading } = setup({
      isMineSelected: true,
      loadingMemo: false,
      playMemo: null,
    });

    // Assert
    expect(showEditor.value).toBe(false);
    expect(showFailedNotice.value).toBe(true);
    expect(showLoading.value).toBe(false);
  });
});

describe('他メンバーの行: 読み込み境界', () => {
  it('公開メモ一覧がまだ届いていない間は読めない理由を断定しない（① の指摘）', () => {
    // Arrange & Act: sharedPlayMemos 到着前は entry.readable が誤って false になり得る
    const entry = makeEntry({ readable: false, tag: 'private' });
    const { readerEntry, showLoading, showEditor, showFailedNotice } = setup({
      isMineSelected: false,
      loadingSharedPlayMemos: true,
      selectedEntry: entry,
      canViewShared: true,
    });

    // Assert
    expect(readerEntry.value).toBeNull();
    expect(showLoading.value).toBe(true);
    expect(showEditor.value).toBe(false);
    expect(showFailedNotice.value).toBe(false);
  });

  it('一覧が届けば選択中の行をそのまま出す', () => {
    // Arrange
    const entry = makeEntry({ readable: true, tag: 'shared' });

    // Act
    const { readerEntry, showLoading } = setup({
      isMineSelected: false,
      loadingSharedPlayMemos: false,
      selectedEntry: entry,
      canViewShared: true,
    });

    // Assert
    expect(readerEntry.value).toEqual(entry);
    expect(showLoading.value).toBe(false);
  });

  it('選べる行が無ければローディングでも失敗でもない（空表示はビュー側の最終フォールバック）', () => {
    // Arrange & Act
    const { readerEntry, showLoading, showFailedNotice } = setup({
      isMineSelected: false,
      loadingSharedPlayMemos: false,
      selectedEntry: null,
      canViewShared: true,
    });

    // Assert
    expect(readerEntry.value).toBeNull();
    expect(showLoading.value).toBe(false);
    expect(showFailedNotice.value).toBe(false);
  });
});

describe('showEditor', () => {
  it('サイドバーがある時期に他メンバーが選択されていればエディタは出さない', () => {
    // Arrange & Act
    const { showEditor } = setup({
      canViewShared: true,
      isMineSelected: false,
      isMyMemo: true,
      playMemo: makePlayMemo(),
    });

    // Assert
    expect(showEditor.value).toBe(false);
  });

  it('サイドバーが無い時期は常に自分のメモなのでエディタを出す', () => {
    // Arrange & Act
    const { showEditor } = setup({
      canViewShared: false,
      isMineSelected: false, // サイドバーが無い時期はこの値によらない
      isMyMemo: true,
      playMemo: makePlayMemo(),
    });

    // Assert
    expect(showEditor.value).toBe(true);
  });

  it('メンバーでなければ出さない', () => {
    // Arrange & Act
    const { showEditor } = setup({
      isMyMemo: false,
      isMineSelected: true,
      playMemo: makePlayMemo(),
    });

    // Assert
    expect(showEditor.value).toBe(false);
  });
});
