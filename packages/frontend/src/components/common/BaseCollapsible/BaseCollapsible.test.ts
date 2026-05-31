// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCollapsible from './BaseCollapsible.vue'

describe('BaseCollapsible', () => {
  describe('レンダリング', () => {
    it('title prop がアクティベーターに表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCollapsible, { props: { title: 'よくある質問' } })

      // Assert
      expect(wrapper.find('.collapsible__title').text()).toBe('よくある質問')
    })
  })

  describe('defaultOpen', () => {
    it('defaultOpen 未指定のとき初期状態でコンテンツが非表示になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseCollapsible, {
        props: { title: 'タイトル' },
        slots: { default: '<p class="content">コンテンツ</p>' },
      })

      // Assert
      // @vuetify/v0 Collapsible はデフォルトで閉じた状態
      expect(wrapper.find('.collapsible__content').isVisible()).toBe(false)
    })

    it('defaultOpen=true のとき初期状態でコンテンツが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCollapsible, {
        props: { title: 'タイトル', defaultOpen: true },
        slots: { default: '<p class="content">コンテンツ</p>' },
      })

      // Assert
      expect(wrapper.find('.collapsible__content').isVisible()).toBe(true)
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
      // Arrange
      const wrapper = mount(BaseCollapsible, {
        props: { title: 'タイトル', defaultOpen: true },
        slots: { default: '<p>コンテンツ</p>' },
      })

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
      const activator = wrapper.find('.collapsible__activator')
      expect(activator.attributes('aria-expanded')).toBeDefined()
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
