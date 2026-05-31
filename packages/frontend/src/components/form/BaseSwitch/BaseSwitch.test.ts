// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSwitch from './BaseSwitch.vue'

describe('BaseSwitch', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch)

      // Assert
      expect(wrapper.find('.switch').exists()).toBe(true)
    })
  })

  describe('label', () => {
    it('label prop を渡したときラベルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch, { props: { label: '通知を有効にする' } })

      // Assert
      expect(wrapper.find('.switch__label').text()).toBe('通知を有効にする')
    })

    it('label prop がないとき .switch__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch)

      // Assert
      expect(wrapper.find('.switch__label').exists()).toBe(false)
    })
  })

  describe('modelValue', () => {
    it('modelValue=false のとき OFF 状態でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch, { props: { modelValue: false } })

      // Assert
      const root = wrapper.find('.switch__root')
      const isChecked =
        root.attributes('aria-checked') === 'true' ||
        root.attributes('data-state') === 'checked'
      expect(isChecked).toBe(false)
    })

    it('modelValue=true のとき ON 状態でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch, { props: { modelValue: true } })

      // Assert
      const root = wrapper.find('.switch__root')
      const isChecked =
        root.attributes('aria-checked') === 'true' ||
        root.attributes('data-state') === 'checked'
      expect(isChecked).toBe(true)
    })

    it('クリックしたとき update:modelValue イベントが発火する', async () => {
      // Arrange
      const wrapper = mount(BaseSwitch, { props: { modelValue: false } })

      // Act
      await wrapper.find('.switch__root').trigger('click')

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('disabled', () => {
    it('disabled=true のとき .switch--disabled クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch, { props: { disabled: true } })

      // Assert
      expect(wrapper.find('.switch').classes()).toContain('switch--disabled')
    })
  })

  describe('アクセシビリティ', () => {
    it('Switch.Root に role="switch" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch)

      // Assert
      expect(wrapper.find('[role="switch"]').exists()).toBe(true)
    })

    it('modelValue=true のとき aria-checked="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch, { props: { modelValue: true } })

      // Assert
      expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
    })

    it('modelValue=false のとき aria-checked="false" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSwitch, { props: { modelValue: false } })

      // Assert
      expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('false')
    })
  })
})
