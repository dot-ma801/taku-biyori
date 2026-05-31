// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSelect from './BaseSelect.vue'

// NOTE: @vuetify/v0 Select.Value は値が選択されているときのみ slot を描画する。
//       未選択時のプレースホルダーは Select.Placeholder コンポーネントで表示する設計。
//       BaseSelect.vue では Select.Placeholder を使って実装している。
//
//       disabled の表現: Select.Root が fragment root のため class の inheritAttrs が
//       自動継承されない。disabled は Select.Root が内部で制御するため、
//       Select.Activator に直接 disabled 属性が付かない場合がある。

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
    it('modelValue が未選択のときプレースホルダーが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, { props: { options: sampleOptions } })

      // Assert
      // Select.Placeholder は未選択時に表示される専用コンポーネント
      expect(wrapper.find('.select__placeholder').text().trim()).toBe('選択してください')
    })

    it('placeholder prop を渡したときそのテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, {
        props: { options: sampleOptions, placeholder: '都道府県を選ぶ' },
      })

      // Assert
      expect(wrapper.find('.select__placeholder').text().trim()).toBe('都道府県を選ぶ')
    })
  })

  describe('modelValue', () => {
    it('modelValue に対応する option のラベルがトリガーに表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSelect, {
        props: { options: sampleOptions, modelValue: 'tokyo' },
      })

      // Assert
      expect(wrapper.find('.select__activator').text()).toContain('東京都')
    })
  })
})
