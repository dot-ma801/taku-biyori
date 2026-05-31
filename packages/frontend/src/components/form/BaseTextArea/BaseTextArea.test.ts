// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTextArea from './BaseTextArea.vue'

describe('BaseTextArea', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea)

      // Assert
      expect(wrapper.find('textarea').exists()).toBe(true)
    })
  })

  describe('label / placeholder / hint', () => {
    it('label prop を渡したときラベルテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { label: '本文' } })

      // Assert
      expect(wrapper.find('.textarea-wrap__label').text()).toBe('本文')
    })

    it('label prop がないとき .textarea-wrap__label が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea)

      // Assert
      expect(wrapper.find('.textarea-wrap__label').exists()).toBe(false)
    })

    it('placeholder prop を渡したときプレースホルダーが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { placeholder: '内容を入力...' } })

      // Assert
      expect(wrapper.find('textarea').attributes('placeholder')).toBe('内容を入力...')
    })

    it('hint prop を渡したときヒントテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { hint: '最大 1000 文字' } })

      // Assert
      expect(wrapper.find('.textarea-wrap__hint').text()).toBe('最大 1000 文字')
    })
  })

  describe('modelValue', () => {
    it('modelValue の値がテキストエリアに表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { modelValue: '初期テキスト' } })

      // Assert
      expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('初期テキスト')
    })

    it('入力すると update:modelValue イベントが発火する', async () => {
      // Arrange
      const wrapper = mount(BaseTextArea)

      // Act
      await wrapper.find('textarea').setValue('新しいテキスト')

      // Assert
      expect(wrapper.emitted('update:modelValue')).toEqual([['新しいテキスト']])
    })
  })

  describe('rows', () => {
    it('rows prop がテキストエリアの rows 属性に反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { rows: 6 } })

      // Assert
      expect(wrapper.find('textarea').attributes('rows')).toBe('6')
    })
  })

  describe('resize', () => {
    it.each(['none', 'vertical', 'horizontal', 'both'] as const)(
      'resize="%s" のとき style に resize: %s が反映される',
      (resize) => {
        // Arrange & Act
        const wrapper = mount(BaseTextArea, { props: { resize } })

        // Assert
        expect(wrapper.find('textarea').attributes('style')).toContain(`resize: ${resize}`)
      },
    )
  })

  describe('バリデーション', () => {
    it('rules が評価されエラーのときエラーメッセージが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, {
        props: {
          modelValue: '',
          rules: [(v: string) => !!v || '必須項目です'],
        },
      })

      // Assert
      expect(wrapper.find('.textarea-wrap__error').text()).toBe('必須項目です')
    })

    it('エラー表示中はヒントテキストが非表示になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, {
        props: {
          modelValue: '',
          hint: 'ヒント',
          rules: [(v: string) => !!v || '必須項目です'],
        },
      })

      // Assert
      expect(wrapper.find('.textarea-wrap__hint').exists()).toBe(false)
    })

    it('バリデーションを通過したときエラーメッセージが表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, {
        props: {
          modelValue: 'テスト入力',
          rules: [(v: string) => !!v || '必須項目です'],
        },
      })

      // Assert
      expect(wrapper.find('.textarea-wrap__error').exists()).toBe(false)
    })
  })

  describe('disabled / readonly', () => {
    it('disabled=true のとき textarea が入力不能になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { disabled: true } })

      // Assert
      expect(wrapper.find('textarea').element.disabled).toBe(true)
    })

    it('readonly=true のとき textarea が読み取り専用になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTextArea, { props: { readonly: true } })

      // Assert
      expect(wrapper.find('textarea').element.readOnly).toBe(true)
    })
  })
})
