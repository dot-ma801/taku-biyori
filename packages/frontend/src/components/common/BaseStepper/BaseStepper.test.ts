// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseStepper from '@/components/common/BaseStepper/BaseStepper.vue';

const steps = ['候補日選択', '参加者選択', '確認'];

describe('BaseStepper', () => {
  describe('レンダリング', () => {
    it('steps の数だけ .stepper__item がレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 1 } });

      // Assert
      expect(wrapper.findAll('.stepper__item')).toHaveLength(3);
    });

    it('各ステップのラベルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 1 } });

      // Assert
      expect(wrapper.text()).toContain('候補日選択');
      expect(wrapper.text()).toContain('参加者選択');
      expect(wrapper.text()).toContain('確認');
    });
  });

  describe('current', () => {
    it('current より前のステップに .stepper__item--completed クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 3 } });
      const items = wrapper.findAll('.stepper__item');

      // Assert
      expect(items[0]!.classes()).toContain('stepper__item--completed');
      expect(items[1]!.classes()).toContain('stepper__item--completed');
    });

    it('current と一致するステップに .stepper__item--active クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 2 } });
      const items = wrapper.findAll('.stepper__item');

      // Assert
      expect(items[1]!.classes()).toContain('stepper__item--active');
    });

    it('current より後のステップに .stepper__item--upcoming クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 1 } });
      const items = wrapper.findAll('.stepper__item');

      // Assert
      expect(items[1]!.classes()).toContain('stepper__item--upcoming');
      expect(items[2]!.classes()).toContain('stepper__item--upcoming');
    });

    it('completed のステップに完了を示す視覚的に隠れたテキストが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 2 } });

      // Assert
      expect(wrapper.find('.stepper__item--completed').text()).toContain(
        '（完了）',
      );
    });
  });

  describe('アクセシビリティ', () => {
    it('active なステップに aria-current="step" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 2 } });
      const items = wrapper.findAll('.stepper__item');

      // Assert
      expect(items[1]!.attributes('aria-current')).toBe('step');
      expect(items[0]!.attributes('aria-current')).toBeUndefined();
      expect(items[2]!.attributes('aria-current')).toBeUndefined();
    });

    it('label prop がリストの aria-label に反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, {
        props: { steps, current: 1, label: '卓確定の手順' },
      });

      // Assert
      expect(wrapper.find('.stepper').attributes('aria-label')).toBe(
        '卓確定の手順',
      );
    });

    it('label を指定しないとき既定のラベルが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 1 } });

      // Assert
      expect(wrapper.find('.stepper').attributes('aria-label')).toBe(
        'ステップ',
      );
    });

    it('現在のステップを示す aria-live 領域に現在地の文言が含まれる', () => {
      // Arrange & Act
      const wrapper = mount(BaseStepper, { props: { steps, current: 2 } });

      // Assert
      expect(wrapper.find('[aria-live="polite"]').text()).toBe(
        'ステップ2/3: 参加者選択',
      );
    });
  });
});
