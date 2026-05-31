// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseSkeleton from './BaseSkeleton.vue'

describe('BaseSkeleton', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton)

      // Assert
      expect(wrapper.find('.skeleton').exists()).toBe(true)
    })
  })

  describe('width / height', () => {
    it('width prop が style に反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { width: '200px' } })

      // Assert
      expect(wrapper.find('.skeleton').attributes('style')).toContain('width: 200px')
    })

    it('height prop が style に反映される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { height: '40px' } })

      // Assert
      expect(wrapper.find('.skeleton').attributes('style')).toContain('height: 40px')
    })
  })

  describe('rounded', () => {
    it.each(['sm', 'md', 'full'] as const)(
      'rounded="%s" のとき .skeleton--%s クラスが付与される',
      (rounded) => {
        // Arrange & Act
        const wrapper = mount(BaseSkeleton, { props: { rounded } })

        // Assert
        expect(wrapper.find('.skeleton').classes()).toContain(`skeleton--${rounded}`)
      },
    )
  })

  describe('lines', () => {
    it('lines=1 のとき要素が 1 つ描画される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { lines: 1 } })

      // Assert
      expect(wrapper.findAll('.skeleton')).toHaveLength(1)
    })

    it('lines=3 のとき要素が 3 つ描画される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { lines: 3 } })

      // Assert
      expect(wrapper.findAll('.skeleton')).toHaveLength(3)
    })

    it('複数行のとき最終行の幅が 70% になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { lines: 3, width: '100%' } })

      // Assert
      const items = wrapper.findAll('.skeleton')
      const lastItem = items[items.length - 1]
      expect(lastItem.attributes('style')).toContain('width: 70%')
    })

    it('複数行のとき最終行以外の幅が width prop の値になる', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { lines: 3, width: '80%' } })

      // Assert
      const items = wrapper.findAll('.skeleton')
      expect(items[0].attributes('style')).toContain('width: 80%')
      expect(items[1].attributes('style')).toContain('width: 80%')
    })
  })

  describe('アクセシビリティ', () => {
    it('単一行のとき aria-hidden="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { lines: 1 } })

      // Assert
      expect(wrapper.find('.skeleton').attributes('aria-hidden')).toBe('true')
    })

    it('複数行のとき全要素に aria-hidden="true" が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseSkeleton, { props: { lines: 3 } })

      // Assert
      const items = wrapper.findAll('.skeleton')
      items.forEach((item) => {
        expect(item.attributes('aria-hidden')).toBe('true')
      })
    })
  })
})
