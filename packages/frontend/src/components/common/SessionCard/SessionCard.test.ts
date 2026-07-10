// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SessionCard from '@/components/common/SessionCard/SessionCard.vue';

describe('SessionCard', () => {
  const baseProps = {
    title: '闇夜のクトゥルフ',
    dateLabel: '7月20日（日）19:00〜',
    location: '新宿・ボードゲームカフェ',
  };

  describe('レンダリング', () => {
    it('タイトル・日時・場所が表示される', () => {
      // Arrange & Act
      const wrapper = mount(SessionCard, { props: baseProps });

      // Assert
      expect(wrapper.find('.session-card__title').text()).toBe(
        '闇夜のクトゥルフ',
      );
      expect(wrapper.find('.session-card__meta').text()).toContain(
        '7月20日（日）19:00〜',
      );
      expect(wrapper.find('.session-card__meta').text()).toContain(
        '新宿・ボードゲームカフェ',
      );
    });

    it('デフォルトでは status="recruiting" として募集中バッジが表示される', () => {
      // Arrange & Act
      const wrapper = mount(SessionCard, { props: baseProps });

      // Assert
      expect(wrapper.text()).toContain('募集中');
    });
  });

  describe('status', () => {
    it.each([
      ['recruiting', '募集中'],
      ['full', '満席'],
      ['confirmed', '開催確定'],
      ['ended', '終了'],
    ] as const)('status="%s" のときラベル "%s" を表示する', (status, label) => {
      // Arrange & Act
      const wrapper = mount(SessionCard, {
        props: { ...baseProps, status },
      });

      // Assert
      expect(wrapper.text()).toContain(label);
    });
  });

  describe('members', () => {
    it('members が渡されたときアバターが表示される', () => {
      // Arrange & Act
      const wrapper = mount(SessionCard, {
        props: { ...baseProps, members: ['あ', 'い'] },
      });

      // Assert
      expect(wrapper.findAll('.session-card__avatar').length).toBe(2);
    });

    it('members が 4 件を超えたとき +N のオーバーフロー表示が出る', () => {
      // Arrange & Act
      const wrapper = mount(SessionCard, {
        props: {
          ...baseProps,
          members: ['あ', 'い', 'う', 'え', 'お', 'か'],
        },
      });

      // Assert
      expect(wrapper.find('.session-card__avatar--more').text()).toBe('+2');
    });
  });

  describe('click', () => {
    it('クリックで click イベントを emit する', async () => {
      // Arrange
      const wrapper = mount(SessionCard, { props: baseProps });

      // Act
      await wrapper.trigger('click');

      // Assert
      expect(wrapper.emitted('click')).toHaveLength(1);
    });
  });
});
