// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseBadge from './BaseBadge.vue'

describe('BaseBadge', () => {
  describe('レンダリング', () => {
    it('デフォルト props でテキストバッジがレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseBadge, { slots: { default: '公開中' } })

      // Assert
      expect(wrapper.find('.badge').exists()).toBe(true)
      expect(wrapper.text()).toBe('公開中')
    })
  })

  describe('variant', () => {
    it.each(['default', 'primary', 'success', 'warning', 'error'] as const)(
      'variant="%s" のとき .badge--%s クラスが付与される',
      (variant) => {
        // Arrange & Act
        const wrapper = mount(BaseBadge, { props: { variant } })

        // Assert
        expect(wrapper.find('.badge').classes()).toContain(`badge--${variant}`)
      },
    )

    it.each(['default', 'primary', 'success', 'warning', 'error'] as const)(
      'dot=true かつ variant="%s" のとき .badge-dot--%s クラスが付与される',
      (variant) => {
        // Arrange & Act
        const wrapper = mount(BaseBadge, { props: { dot: true, variant } })

        // Assert
        expect(wrapper.find('.badge-dot').classes()).toContain(`badge-dot--${variant}`)
      },
    )
  })

  describe('dot', () => {
    it('dot=false のときテキストバッジとして表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseBadge, {
        props: { dot: false },
        slots: { default: 'ラベル' },
      })

      // Assert
      expect(wrapper.find('.badge').exists()).toBe(true)
      expect(wrapper.find('.badge-dot').exists()).toBe(false)
    })

    it('dot=true のときドット要素が表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseBadge, { props: { dot: true } })

      // Assert
      expect(wrapper.find('.badge-dot').exists()).toBe(true)
      expect(wrapper.find('.badge').exists()).toBe(false)
    })

    it('dot=true のとき aria-hidden="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseBadge, { props: { dot: true } })

      // Assert
      expect(wrapper.find('.badge-dot').attributes('aria-hidden')).toBe('true')
    })
  })
})
