// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Toast, ToastVariant } from '@/composables/useToast'

// NOTE: vi.hoisted() 内では Vue の import（reactive 等）は TDZ のため使用不可。
//       plain array + get アクセサで代用し、mount 前に差し替える。
const mockDismiss = vi.hoisted(() => vi.fn())

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ get toasts() { return currentToasts }, dismiss: mockDismiss }),
}))

// モジュール import より後に定義した変数を vi.mock factory 内から参照する方法として
// currentToasts を module スコープに置き、beforeEach でリセットする
let currentToasts: Toast[] = []

import BaseToastContainer from './BaseToastContainer.vue'

const teleportStub = { template: '<div><slot /></div>' }

const makeToast = (
  variant: ToastVariant,
  id = 1,
  message = 'テストメッセージ',
): Toast => ({ id, message, variant, duration: 4000 })

describe('BaseToastContainer', () => {
  beforeEach(() => {
    currentToasts = []
    mockDismiss.mockClear()
  })

  describe('レンダリング', () => {
    it('toasts が空のときトースト要素が表示されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: teleportStub } },
      })

      // Assert
      expect(wrapper.findAll('.toast')).toHaveLength(0)
    })
  })

  describe('useToast 連携', () => {
    it.each(['success', 'error', 'warning', 'info'] as const)(
      '%s バリアントのトーストが表示される',
      (variant) => {
        // Arrange
        currentToasts = [makeToast(variant)]

        // Act
        const wrapper = mount(BaseToastContainer, {
          global: { stubs: { Teleport: teleportStub } },
        })

        // Assert
        expect(wrapper.find(`.toast--${variant}`).exists()).toBe(true)
      },
    )

    it('トーストのメッセージテキストが表示される', () => {
      // Arrange
      currentToasts = [makeToast('success', 1, '保存しました')]

      // Act
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: teleportStub } },
      })

      // Assert
      expect(wrapper.find('.toast__message').text()).toBe('保存しました')
    })

    it('複数のトーストが積み上がって表示される', () => {
      // Arrange
      currentToasts = [makeToast('info', 1, '1件目'), makeToast('success', 2, '2件目')]

      // Act
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: teleportStub } },
      })

      // Assert
      expect(wrapper.findAll('.toast')).toHaveLength(2)
    })
  })

  describe('手動消去', () => {
    it('閉じるボタンをクリックしたとき dismiss が toast.id とともに呼ばれる', async () => {
      // Arrange
      currentToasts = [makeToast('info', 42)]
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: teleportStub } },
      })

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
        global: { stubs: { Teleport: teleportStub } },
      })

      // Assert
      expect(wrapper.find('.toast-stack').attributes('aria-live')).toBeTruthy()
    })

    it('閉じるボタンに aria-label が付与されている', async () => {
      // Arrange
      currentToasts = [makeToast('info', 1)]
      const wrapper = mount(BaseToastContainer, {
        global: { stubs: { Teleport: teleportStub } },
      })

      // Assert
      expect(wrapper.find('.toast__close').attributes('aria-label')).toBeTruthy()
    })
  })
})
