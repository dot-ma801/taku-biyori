// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSelect from './BaseSelect.vue'

const sampleOptions = [
  { value: 'tokyo', label: '東京都' },
  { value: 'osaka', label: '大阪府' },
  { value: 'kyoto', label: '京都府', disabled: true },
]

describe('BaseSelect', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.find('.select-wrap').exists()).toBe(true)
    })
  })

  describe('label', () => {
    it('label prop を渡したときラベルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, {
        props: { options: sampleOptions, label: '都道府県' },
      })

      // Assert
      expect(wrapper.find('.select-wrap__label').text()).toBe('都道府県')
    })

    it('label prop がないとき .select-wrap__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.find('.select-wrap__label').exists()).toBe(false)
    })
  })

  describe('placeholder', () => {
    it('modelValue が未選択のときデフォルトプレースホルダーが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.find('.select__placeholder').text()).toBe('選択してください')
    })

    it('placeholder prop を渡したときそのテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, {
        props: { options: sampleOptions, placeholder: '都道府県を選ぶ' },
      })

      // Assert
      expect(wrapper.find('.select__placeholder').text()).toBe('都道府県を選ぶ')
    })
  })

  describe('modelValue', () => {
    it('modelValue に対応する option のラベルがトリガーに表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, {
        props: { options: sampleOptions, modelValue: 'tokyo' },
      })

      // Assert
      expect(wrapper.find('.select__value').text()).toBe('東京都')
    })
  })

  describe('disabled', () => {
    it('disabled=true のときトリガーが操作不能になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, {
        props: { options: sampleOptions, disabled: true },
      })

      // Assert
      expect(wrapper.find('.select__activator').element.disabled).toBe(true)
    })
  })
})
