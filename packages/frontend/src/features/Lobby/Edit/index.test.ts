import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LobbyEdit from '@/features/Lobby/Edit/index.vue';

/**
 * `showCandidateDates` は Boolean の prop なので、**省略されると `undefined` ではなく
 * `false` になる**（Vue の boolean casting）。既定値を明示していないと、渡し忘れた
 * 画面から候補日とひとことの入力欄が丸ごと消える。その既定をここで押さえる。
 */

const baseProps = {
  heading: 'ロビー新規作成',
  submitLabel: 'ロビーを作成する',
  loading: false,
  errorMessages: [],
  pendingDates: [{ date: '2026-10-01', timeLabel: '' }],
};

describe('LobbyEdit', () => {
  it('showCandidateDates を省略しても候補日のひとことを入力できる', () => {
    // Arrange / Act
    const wrapper = mount(LobbyEdit, { props: baseProps });

    // Assert
    expect(wrapper.find('.dates').exists()).toBe(true);
    expect(wrapper.find('.note-input input').exists()).toBe(true);
  });

  it('showCandidateDates が false なら候補日の入力を出さない', () => {
    // Arrange / Act
    const wrapper = mount(LobbyEdit, {
      props: { ...baseProps, showCandidateDates: false },
    });

    // Assert
    expect(wrapper.find('.dates').exists()).toBe(false);
  });
});
