// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseProgress from './BaseProgress.vue'

describe('BaseProgress', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress)

      // Assert
      expect(wrapper.find('.progress-wrap').exists()).toBe(true)
    })
  })

  describe('variant', () => {
    it.each(['default', 'success', 'warning', 'error'] as const)(
      'variant="%s" のとき .progress--%s クラスが付与される',
      (variant) => {
        // Arrange & Act
        const wrapper = mount(BaseProgress, { props: { variant } })

        // Assert
        expect(wrapper.find('.progress-wrap').classes()).toContain(`progress--${variant}`)
      },
    )
  })

  describe('size', () => {
    it.each(['sm', 'md'] as const)(
      'size="%s" のとき .progress-wrap--%s クラスが付与される',
      (size) => {
        // Arrange & Act
        const wrapper = mount(BaseProgress, { props: { size } })

        // Assert
        expect(wrapper.find('.progress-wrap').classes()).toContain(`progress-wrap--${size}`)
      },
    )
  })

  describe('indeterminate', () => {
    it('indeterminate=false のとき .progress--indeterminate クラスが付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { indeterminate: false } })

      // Assert
      expect(wrapper.find('.progress-wrap').classes()).not.toContain('progress--indeterminate')
    })

    it('indeterminate=true のとき .progress--indeterminate クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { indeterminate: true } })

      // Assert
      expect(wrapper.find('.progress-wrap').classes()).toContain('progress--indeterminate')
    })
  })

  describe('label', () => {
    it('label prop を渡したときラベルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { label: 'アップロード中' } })

      // Assert
      expect(wrapper.find('.progress-wrap__label').text()).toBe('アップロード中')
    })

    it('label prop がないとき .progress-wrap__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress)

      // Assert
      expect(wrapper.find('.progress-wrap__label').exists()).toBe(false)
    })
  })

  describe('showValue', () => {
    it('showValue=false のとき .progress-wrap__value が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { showValue: false } })

      // Assert
      expect(wrapper.find('.progress-wrap__value').exists()).toBe(false)
    })

    it('showValue=true のとき .progress-wrap__value が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { value: 50, showValue: true } })

      // Assert
      expect(wrapper.find('.progress-wrap__value').exists()).toBe(true)
    })
  })

  describe('アクセシビリティ', () => {
    it('role="progressbar" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress)

      // Assert
      expect(wrapper.find('[role="progressbar"]').exists()).toBe(true)
    })

    it('aria-valuemin="0" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { value: 50 } })

      // Assert
      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuemin')).toBe('0')
    })

    it('aria-valuenow に現在値が反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { value: 75 } })

      // Assert
      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('75')
    })

    it('aria-valuemax に max prop の値が反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseProgress, { props: { value: 50, max: 200 } })

      // Assert
      expect(wrapper.find('[role="progressbar"]').attributes('aria-valuemax')).toBe('200')
    })
  })
})
