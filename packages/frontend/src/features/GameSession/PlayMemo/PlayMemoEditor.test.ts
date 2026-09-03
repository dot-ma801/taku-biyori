import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayMemoEditor from '@/features/GameSession/PlayMemo/PlayMemoEditor.vue';
import type { MyPlayMemoModel } from '@/models/play-memo';

function makePlayMemo(
  overrides: Partial<MyPlayMemoModel> = {},
): MyPlayMemoModel {
  return {
    seatId: 'member-1',
    body: '',
    sharedAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function mountEditor(
  props: Partial<InstanceType<typeof PlayMemoEditor>['$props']> = {},
) {
  return mount(PlayMemoEditor, {
    props: {
      lobbyId: 'lobby-1',
      gameSessionId: 'session-1',
      gameSessionTitle: 'テストセッション',
      playMemo: makePlayMemo(),
      canEditBody: true,
      isShared: false,
      canToggleVisibility: true,
      visibilityStatus: 'idle',
      ...props,
    },
    global: {
      stubs: { RouterLink: true },
    },
  });
}

describe('公開トグルの説明文', () => {
  it('完了・中止かつ本文未保存（袋小路）のときは「もう手が無い」ことを伝える', () => {
    // Arrange & Act: canEditBody も canToggleVisibility も false
    // （完了・中止していて、本文を一度も保存していない）
    const wrapper = mountEditor({
      canEditBody: false,
      canToggleVisibility: false,
      playMemo: makePlayMemo({ body: '', updatedAt: null }),
    });

    // Assert: 保存を促す指示（実行不可能）を出さない
    expect(wrapper.text()).toContain(
      '本文が保存されていないため、このメモは公開できません。',
    );
    expect(wrapper.text()).not.toContain('本文を保存すると');
  });

  it('編集中（本文を保存すれば公開できる）なら保存を促す文言のまま', () => {
    // Arrange & Act: canEditBody は true、まだ保存していない
    const wrapper = mountEditor({
      canEditBody: true,
      canToggleVisibility: false,
      playMemo: makePlayMemo({ body: '', updatedAt: null }),
    });

    // Assert
    expect(wrapper.text()).toContain(
      '本文を保存すると、このメモを公開できるようになります。',
    );
  });

  it('切替可能なら通常の説明文を出す', () => {
    // Arrange & Act
    const wrapper = mountEditor({
      canEditBody: false,
      canToggleVisibility: true,
      isShared: false,
      playMemo: makePlayMemo({
        body: '本文あり',
        updatedAt: new Date('2026-08-01T00:00:00Z'),
      }),
    });

    // Assert
    expect(wrapper.text()).toContain('このメモはあなただけが読めます。');
  });
});
