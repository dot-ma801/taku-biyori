// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCheckbox from './BaseCheckbox.vue'

describe('BaseCheckbox', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox)

      // Assert
      expect(wrapper.find('.checkbox').exists()).toBe(true)
    })
  })

  describe('label', () => {
    it('label prop を渡したときラベルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox, { props: { label: '利用規約に同意する' } })

      // Assert
      expect(wrapper.find('.checkbox__label').text()).toBe('利用規約に同意する')
    })

    it('label prop がないとき .checkbox__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox)

      // Assert
      expect(wrapper.find('.checkbox__label').exists()).toBe(false)
    })

    it('default スロットを渡したときスロットコンテンツが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox, {
        slots: { default: '<span class="custom-label">カスタムラベル</span>' },
      })

      // Assert
      expect(wrapper.find('.custom-label').exists()).toBe(true)
    })
  })

  describe('modelValue', () => {
    it('modelValue=false のとき未チェック状態でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox, { props: { modelValue: false } })

      // Assert
      const root = wrapper.find('.checkbox__root')
      const isChecked =
        root.attributes('aria-checked') === 'true' ||
        root.attributes('data-state') === 'checked'
      expect(isChecked).toBe(false)
    })

    it('modelValue=true のときチェック済み状態でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox, { props: { modelValue: true } })

      // Assert
      const root = wrapper.find('.checkbox__root')
      const isChecked =
        root.attributes('aria-checked') === 'true' ||
        root.attributes('data-state') === 'checked'
      expect(isChecked).toBe(true)
    })

    it('クリックしたとき update:modelValue イベントが発火する', async () => {
      // Arrange
      const wrapper = mount(BaseCheckbox, { props: { modelValue: false } })

      // Act
      await wrapper.find('.checkbox__root').trigger('click')

      // Assert
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('disabled', () => {
    it('disabled=true のとき .checkbox--disabled クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCheckbox, { props: { disabled: true } })

      // Assert
      expect(wrapper.find('.checkbox').classes()).toContain('checkbox--disabled')
    })
  })
})
