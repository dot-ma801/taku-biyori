import { describe, it, expect, beforeEach } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MyPlayMemoCard from '@/features/GameSession/PlayMemo/MyPlayMemoCard.vue';
import type { MyPlayMemoModel } from '@/models/play-memo';
import type { PlayMemoMemberEntry } from '@/features/GameSession/PlayMemo/useSharedPlayMemos';

function makePlayMemo(
  overrides: Partial<MyPlayMemoModel> = {},
): MyPlayMemoModel {
  return {
    seatId: 'member-1',
    body: '書斎の鍵は青木さんが持っていた',
    sharedAt: null,
    updatedAt: new Date('2026-08-03T12:04:00Z'),
    ...overrides,
  };
}

function makeSharedEntry(
  overrides: Partial<PlayMemoMemberEntry> = {},
): PlayMemoMemberEntry {
  return {
    seatId: 'member-other',
    primaryLabel: '青木',
    secondaryLabel: null,
    userId: 'user-other',
    avatarName: '青木',
    tag: 'shared',
    readable: true,
    isMe: false,
    sharedPlayMemo: null,
    ...overrides,
  };
}

function mountCard(
  props: Partial<InstanceType<typeof MyPlayMemoCard>['$props']> = {},
) {
  return mount(MyPlayMemoCard, {
    props: {
      gameSessionId: 'session-1',
      playMemo: null,
      loading: false,
      canEditBody: true,
      canViewShared: false,
      sharedEntries: [],
      ...props,
    },
    global: {
      stubs: { RouterLink: RouterLinkStub },
    },
  });
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('取得中（loading === true）の表示', () => {
  it('書く面: 公開状態バッジを断定表示しない', () => {
    // Arrange & Act
    const wrapper = mountCard({ loading: true, canViewShared: false });

    // Assert
    expect(wrapper.find('.visibility').exists()).toBe(false);
  });

  it('書く面: 本文の有無を断定せず「読み込み中...」を出す', () => {
    // Arrange & Act
    const wrapper = mountCard({ loading: true, canViewShared: false });

    // Assert
    expect(wrapper.text()).toContain('読み込み中...');
    expect(wrapper.text()).not.toContain('最初のメモを書く');
    expect(wrapper.text()).not.toContain(
      'プレイ中の気づきを、自分だけのメモに残せます。',
    );
  });

  it('読む面: 公開状態バッジを断定表示しない', () => {
    // Arrange & Act
    const wrapper = mountCard({ loading: true, canViewShared: true });

    // Assert
    expect(wrapper.find('.visibility').exists()).toBe(false);
  });

  it('読む面: 公開が1件も無い表示でも「読み込み中...」にする（本文の有無を断定しない）', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: true,
      canViewShared: true,
      sharedEntries: [],
    });

    // Assert
    expect(wrapper.text()).toContain('読み込み中...');
    expect(wrapper.text()).not.toContain(
      'この卓のメモはまだ誰も公開していません。',
    );
  });
});

describe('取得済み（loading === false）の表示', () => {
  it('書く面: 公開中バッジを出す', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: false,
      canViewShared: false,
      playMemo: makePlayMemo({ sharedAt: new Date('2026-08-04T09:00:00Z') }),
    });

    // Assert
    expect(wrapper.find('.visibility').exists()).toBe(true);
    expect(wrapper.text()).toContain('公開中');
  });

  it('書く面: 非公開バッジを出す', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: false,
      canViewShared: false,
      playMemo: makePlayMemo({ sharedAt: null }),
    });

    // Assert
    expect(wrapper.text()).toContain('非公開');
  });
});

describe('読む面の CTA ラベル（本文が無いときの袋小路対策）', () => {
  it('公開が1件も無く、本文もまだ無ければ「メモを開く」にする（公開しようがないため）', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: false,
      canViewShared: true,
      sharedEntries: [],
      playMemo: makePlayMemo({ body: '' }),
    });

    // Assert
    expect(wrapper.text()).toContain('メモを開く');
    expect(wrapper.text()).not.toContain('メモを開いて公開する');
  });

  it('公開が1件も無くても、本文があれば「メモを開いて公開する」を出す', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: false,
      canViewShared: true,
      sharedEntries: [],
      playMemo: makePlayMemo({ body: '書きかけの本文' }),
    });

    // Assert
    expect(wrapper.text()).toContain('メモを開いて公開する');
  });

  it('公開しているメンバーが居れば本文の有無によらず「メモを開く」', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: false,
      canViewShared: true,
      sharedEntries: [makeSharedEntry()],
      playMemo: makePlayMemo({ body: '書きかけの本文' }),
    });

    // Assert
    expect(wrapper.text()).toContain('メモを開く');
    expect(wrapper.text()).not.toContain('メモを開いて公開する');
  });

  it('取得中で本文の有無が分からない間は「メモを開く」にする', () => {
    // Arrange & Act
    const wrapper = mountCard({
      loading: true,
      canViewShared: true,
      sharedEntries: [],
    });

    // Assert
    expect(wrapper.text()).toContain('メモを開く');
    expect(wrapper.text()).not.toContain('メモを開いて公開する');
  });
});
