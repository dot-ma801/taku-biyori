// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseDialog from './BaseDialog.vue'

describe('BaseDialog', () => {
  describe('レンダリング', () => {
    it('title prop がダイアログ内に表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, { props: { title: '削除の確認' } })

      // Assert
      expect(wrapper.find('.dialog__title').text()).toBe('削除の確認')
    })
  })

  describe('description', () => {
    it('description prop を渡したときサブテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, {
        props: { title: '確認', description: 'この操作は取り消せません。' },
      })

      // Assert
      expect(wrapper.find('.dialog__description').text()).toBe('この操作は取り消せません。')
    })

    it('description prop がないとき .dialog__description が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, { props: { title: '確認' } })

      // Assert
      expect(wrapper.find('.dialog__description').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('default スロットのコンテンツが .dialog__body に表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, {
        props: { title: '確認' },
        slots: { default: '<p class="body-text">本文テキスト</p>' },
      })

      // Assert
      expect(wrapper.find('.dialog__body .body-text').exists()).toBe(true)
    })

    it('actions スロットのコンテンツが .dialog__actions に表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, {
        props: { title: '確認' },
        slots: { actions: '<button class="action-btn">削除</button>' },
      })

      // Assert
      expect(wrapper.find('.dialog__actions .action-btn').exists()).toBe(true)
    })

    it('actions スロットがないとき .dialog__actions が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, { props: { title: '確認' } })

      // Assert
      expect(wrapper.find('.dialog__actions').exists()).toBe(false)
    })
  })

  describe('アクセシビリティ', () => {
    it('ダイアログ閉じるボタンに aria-label が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseDialog, { props: { title: '確認' } })

      // Assert
      expect(wrapper.find('.dialog__close').attributes('aria-label')).toBeTruthy()
    })
  })
})
