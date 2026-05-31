// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCollapsible from './BaseCollapsible.vue'

// NOTE: @vuetify/v0 Collapsible.Root はアンコントロールドコンポーネント。
//       外部から open prop を渡しても内部状態を書き換えない。
//       初期状態の制御は defaultOpen prop のみ有効だが、jsdom では CSS で隠す実装のため
//       isVisible() が機能しない場合がある。
//       → 開閉状態は「クリック操作後に isVisible() で確認」する戦略をとる。

describe('BaseCollapsible', () => {
  describe('レンダリング', () => {
    it('title prop がアクティベーターに表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCollapsible, { props: { title: 'よくある質問' } })

      // Assert
      expect(wrapper.find('.collapsible__title').text()).toBe('よくある質問')
    })

    it('デフォルト状態でコンテンツが非表示になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseCollapsible, {
        props: { title: 'タイトル' },
        slots: { default: '<p>コンテンツ</p>' },
      })

      // Assert
      expect(wrapper.find('.collapsible__content').isVisible()).toBe(false)
    })
  })

  describe('開閉操作', () => {
    it('アクティベーターをクリックするとコンテンツが表示される', async () => {
      // Arrange
      const wrapper = mount(BaseCollapsible, {
        props: { title: 'タイトル' },
        slots: { default: '<p>コンテンツ</p>' },
      })

      // Act
      await wrapper.find('.collapsible__activator').trigger('click')

      // Assert
      expect(wrapper.find('.collapsible__content').isVisible()).toBe(true)
    })

    it('展開済みのとき再クリックするとコンテンツが非表示になる', async () => {
      // Arrange - クリックして展開状態にする
      const wrapper = mount(BaseCollapsible, {
        props: { title: 'タイトル' },
        slots: { default: '<p>コンテンツ</p>' },
      })
      await wrapper.find('.collapsible__activator').trigger('click')
      expect(wrapper.find('.collapsible__content').isVisible()).toBe(true) // 展開確認

      // Act
      await wrapper.find('.collapsible__activator').trigger('click')

      // Assert
      expect(wrapper.find('.collapsible__content').isVisible()).toBe(false)
    })
  })

  describe('アクセシビリティ', () => {
    it('アクティベーターボタンに aria-expanded 属性が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseCollapsible, { props: { title: 'タイトル' } })

      // Assert
      expect(wrapper.find('.collapsible__activator').attributes('aria-expanded')).toBeDefined()
    })

    it('展開時に aria-expanded="true" になる', async () => {
      // Arrange
      const wrapper = mount(BaseCollapsible, { props: { title: 'タイトル' } })

      // Act
      await wrapper.find('.collapsible__activator').trigger('click')

      // Assert
      expect(wrapper.find('.collapsible__activator').attributes('aria-expanded')).toBe('true')
    })
  })
})
