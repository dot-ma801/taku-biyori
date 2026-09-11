import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import EditView from '@/views/Lobby/EditView.vue';

/**
 * 編集画面が「取得した候補日」をフォームまで届けているかを見るテスト。
 *
 * `useUpdateLobby` は候補日（`pendingDates`）を持っているのに、画面側が
 * `v-model:pendingDates` を繋いでいないと**取得済みの候補日が1件も出ない**まま
 * 保存できてしまう。型でも実行時エラーでも落ちないので、描画で押さえる。
 */

const pendingDates = ref([{ date: '2026-10-01', timeLabel: '19:00〜' }]);

vi.mock('@/features/Lobby/Edit/composables/useUpdateLobby', () => ({
  useUpdateLobby: () => ({
    title: ref('わいわい卓'),
    savedTitle: ref('わいわい卓'),
    scenarioName: ref(''),
    maxMembers: ref(''),
    description: ref(''),
    openUntil: ref(''),
    location: ref(''),
    pendingDates,
    loading: ref(false),
    errorMessages: ref([]),
    fetchError: ref(''),
    hasSchedulePoll: ref(true),
    fetchInitialValues: vi.fn(),
    submit: vi.fn(),
    cancel: vi.fn(),
  }),
}));

const mountView = () =>
  mount(EditView, {
    props: { lobbyId: 'lobby-1' },
    global: { stubs: { RouterLink: true } },
  });

describe('EditView', () => {
  it('取得済みの候補日とひとことを入力欄に出す', () => {
    // Arrange / Act
    const wrapper = mountView();

    // Assert
    const noteInput = wrapper.find('.note-input input');
    expect(wrapper.find('.dates').exists()).toBe(true);
    expect((noteInput.element as HTMLInputElement).value).toBe('19:00〜');
  });

  it('候補日を外すと composable の pendingDates から消える', async () => {
    // Arrange
    const wrapper = mountView();

    // Act
    await wrapper.get('.remove').trigger('click');

    // Assert
    expect(pendingDates.value).toEqual([]);
  });
});
