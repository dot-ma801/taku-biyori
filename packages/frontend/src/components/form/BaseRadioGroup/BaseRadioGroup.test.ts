// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseRadioGroup from './BaseRadioGroup.vue'

const sampleOptions = [
  { value: 'free', label: 'フリー' },
  { value: 'pro', label: 'プロ' },
  { value: 'enterprise', label: 'エンタープライズ', disabled: true },
]

describe('BaseRadioGroup', () => {
  describe('レンダリング', () => {
    it('options の数だけラジオの選択肢が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.findAll('.radio')).toHaveLength(3)
    })

    it('各 option の label がテキストとして表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, { props: { options: sampleOptions } })

      // Assert
      const labels = wrapper.findAll('.radio__label')
      expect(labels[0].text()).toBe('フリー')
      expect(labels[1].text()).toBe('プロ')
      expect(labels[2].text()).toBe('エンタープライズ')
    })
  })

  describe('label', () => {
    it('label prop を渡したとき legend が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, {
        props: { options: sampleOptions, label: 'プランを選択' },
      })

      // Assert
      expect(wrapper.find('.radio-group__legend').text()).toBe('プランを選択')
    })

    it('label prop がないとき legend が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.find('.radio-group__legend').exists()).toBe(false)
    })
  })

  describe('disabled（グループ）', () => {
    it('disabled=true のとき fieldset に disabled 属性が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, {
        props: { options: sampleOptions, disabled: true },
      })

      // Assert
      expect(wrapper.find('fieldset').element.disabled).toBe(true)
    })
  })

  describe('disabled（個別 option）', () => {
    it('option.disabled=true の選択肢に .radio--disabled クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, { props: { options: sampleOptions } })

      // Assert
      const enterpriseLabel = wrapper.findAll('.radio')[2]
      expect(enterpriseLabel.classes()).toContain('radio--disabled')
    })
  })

  describe('direction', () => {
    it('direction 未指定のとき縦並びレイアウト（デフォルト）でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.find('.radio-group__list--row').exists()).toBe(false)
    })

    it('direction="row" のとき .radio-group__list--row クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, {
        props: { options: sampleOptions, direction: 'row' },
      })

      // Assert
      expect(wrapper.find('.radio-group__list--row').exists()).toBe(true)
    })
  })

  describe('アクセシビリティ', () => {
    it('グループのルート要素が fieldset でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, { props: { options: sampleOptions } })

      // Assert
      expect(wrapper.find('fieldset.radio-group').exists()).toBe(true)
    })

    it('label prop が legend 要素としてアクセシブルなグループラベルを提供する', () => {
      // Arrange & Act
      const wrapper = mount(BaseRadioGroup, {
        props: { options: sampleOptions, label: 'プランを選択' },
      })

      // Assert
      expect(wrapper.find('legend').text()).toBe('プランを選択')
    })
  })
})
