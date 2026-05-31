// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseAlert from './BaseAlert.vue'

describe('BaseAlert', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert, { slots: { default: 'お知らせです' } })

      // Assert
      expect(wrapper.find('.alert').exists()).toBe(true)
      expect(wrapper.text()).toContain('お知らせです')
    })
  })

  describe('variant', () => {
    it.each(['info', 'success', 'warning', 'error'] as const)(
      'variant="%s" のとき .alert--%s クラスが付与される',
      (variant) => {
        // Arrange & Act
        const wrapper = mount(BaseAlert, { props: { variant } })

        // Assert
        expect(wrapper.find('.alert').classes()).toContain(`alert--${variant}`)
      },
    )
  })

  describe('title', () => {
    it('title prop を渡したときタイトルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert, { props: { title: '保存完了' } })

      // Assert
      expect(wrapper.find('.alert__title').text()).toBe('保存完了')
    })

    it('title prop がないとき .alert__title 要素が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert)

      // Assert
      expect(wrapper.find('.alert__title').exists()).toBe(false)
    })
  })

  describe('dismissible', () => {
    it('dismissible=false のとき閉じるボタンが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert, { props: { dismissible: false } })

      // Assert
      expect(wrapper.find('.alert__dismiss').exists()).toBe(false)
    })

    it('dismissible=true のとき閉じるボタンが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert, { props: { dismissible: true } })

      // Assert
      expect(wrapper.find('.alert__dismiss').exists()).toBe(true)
    })

    it('閉じるボタンをクリックしたとき dismiss イベントが発火する', async () => {
      // Arrange
      const wrapper = mount(BaseAlert, { props: { dismissible: true } })

      // Act
      await wrapper.find('.alert__dismiss').trigger('click')

      // Assert
      expect(wrapper.emitted('dismiss')).toHaveLength(1)
    })
  })

  describe('アクセシビリティ', () => {
    it('role="alert" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert)

      // Assert
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })

    it('dismissible=true のとき閉じるボタンに aria-label が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseAlert, { props: { dismissible: true } })

      // Assert
      expect(wrapper.find('.alert__dismiss').attributes('aria-label')).toBeTruthy()
    })
  })
})
