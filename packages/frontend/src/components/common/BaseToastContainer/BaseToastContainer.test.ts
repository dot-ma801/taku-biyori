// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import type { Toast } from '@/composables/useToast'

// vi.hoisted で reactive なトースト配列と dismiss モックを事前生成
const mockToasts = vi.hoisted(() => reactive<Toast[]>([]))
const mockDismiss = vi.hoisted(() => vi.fn())

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toasts: mockToasts,
    dismiss: mockDismiss,
  }),
}))

import BaseToastContainer from './BaseToastContainer.vue'

describe('BaseToastContainer', () => {
  beforeEach(() => {
    mockToasts.splice(0)
    mockDismiss.mockClear()
  })

  describe('レンダリング', () => {
    it('toasts が空のときトースト要素が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
      })

      // Assert
      expect(wrapper.findAll('.toast')).toHaveLength(0)
    })
  })

  describe('useToast 連携', () => {
    it.each(['success', 'error', 'warning', 'info'] as const)(
      '%s バリアントのトーストが表示される',
      async (variant) => {
        // Arrange
        const wrapper = mount(BaseToastContainer, {
          global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
        })

        // Act
        mockToasts.push({ id: 1, message: 'テスト', variant, duration: 4000 })
        await wrapper.vm.$nextTick()

        // Assert
        expect(wrapper.find(`.toast--${variant}`).exists()).toBe(true)
      },
    )

    it('トーストのメッセージテキストが表示される', async () => {
      // Arrange
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
      })

      // Act
      mockToasts.push({ id: 1, message: '保存しました', variant: 'success', duration: 4000 })
      await wrapper.vm.$nextTick()

      // Assert
      expect(wrapper.find('.toast__message').text()).toBe('保存しました')
    })

    it('複数のトーストが積み上がって表示される', async () => {
      // Arrange
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
      })

      // Act
      mockToasts.push(
        { id: 1, message: '1件目', variant: 'info', duration: 4000 },
        { id: 2, message: '2件目', variant: 'success', duration: 4000 },
      )
      await wrapper.vm.$nextTick()

      // Assert
      expect(wrapper.findAll('.toast')).toHaveLength(2)
    })
  })

  describe('手動消去', () => {
    it('閉じるボタンをクリックしたとき dismiss が toast.id とともに呼ばれる', async () => {
      // Arrange
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
      })
      mockToasts.push({ id: 42, message: 'テスト', variant: 'info', duration: 4000 })
      await wrapper.vm.$nextTick()

      // Act
      await wrapper.find('.toast__close').trigger('click')

      // Assert
      expect(mockDismiss).toHaveBeenCalledWith(42)
    })
  })

  describe('アクセシビリティ', () => {
    it('トーストスタックに aria-live 属性が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
      })

      // Assert
      expect(wrapper.find('.toast-stack').attributes('aria-live')).toBeTruthy()
    })

    it('閉じるボタンに aria-label が付与されている', async () => {
      // Arrange
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
      })
      mockToasts.push({ id: 1, message: 'テスト', variant: 'info', duration: 4000 })
      await wrapper.vm.$nextTick()

      // Assert
      expect(wrapper.find('.toast__close').attributes('aria-label')).toBeTruthy()
    })
  })
})
