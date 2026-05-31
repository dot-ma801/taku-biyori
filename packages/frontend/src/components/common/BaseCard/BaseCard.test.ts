// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseCard from './BaseCard.vue'

describe('BaseCard', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard)

      // Assert
      expect(wrapper.find('.card').exists()).toBe(true)
    })
  })

  describe('title / subtitle', () => {
    it('title prop を渡したときタイトルが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, { props: { title: 'ユーザー情報' } })

      // Assert
      expect(wrapper.find('.card__title').text()).toBe('ユーザー情報')
    })

    it('subtitle prop を渡したときサブテキストが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, {
        props: { title: 'タイトル', subtitle: 'サブテキスト' },
      })

      // Assert
      expect(wrapper.find('.card__subtitle').text()).toBe('サブテキスト')
    })

    it('title も subtitle も header スロットもないときヘッダー領域が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard)

      // Assert
      expect(wrapper.find('.card__header').exists()).toBe(false)
    })
  })

  describe('slots', () => {
    it('default スロットのコンテンツが .card__body に表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, {
        slots: { default: '<p class="body-content">本文</p>' },
      })

      // Assert
      expect(wrapper.find('.card__body .body-content').exists()).toBe(true)
    })

    it('header スロットを渡したとき title/subtitle props より優先して表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, {
        props: { title: 'props のタイトル' },
        slots: { header: '<span class="custom-header">カスタムヘッダー</span>' },
      })

      // Assert
      expect(wrapper.find('.custom-header').text()).toBe('カスタムヘッダー')
      expect(wrapper.find('.card__title').exists()).toBe(false)
    })

    it('actions スロットを渡したとき .card__actions に表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, {
        slots: { actions: '<button class="action-btn">保存</button>' },
      })

      // Assert
      expect(wrapper.find('.card__actions .action-btn').exists()).toBe(true)
    })

    it('actions スロットがないとき .card__actions が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard)

      // Assert
      expect(wrapper.find('.card__actions').exists()).toBe(false)
    })
  })

  describe('noPadding', () => {
    it('noPadding=false のとき .card--no-padding クラスが付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, { props: { noPadding: false } })

      // Assert
      expect(wrapper.find('.card').classes()).not.toContain('card--no-padding')
    })

    it('noPadding=true のとき .card--no-padding クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, { props: { noPadding: true } })

      // Assert
      expect(wrapper.find('.card').classes()).toContain('card--no-padding')
    })
  })

  describe('hoverable', () => {
    it('hoverable=false のとき .card--hoverable クラスが付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, { props: { hoverable: false } })

      // Assert
      expect(wrapper.find('.card').classes()).not.toContain('card--hoverable')
    })

    it('hoverable=true のとき .card--hoverable クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseCard, { props: { hoverable: true } })

      // Assert
      expect(wrapper.find('.card').classes()).toContain('card--hoverable')
    })
  })
})
