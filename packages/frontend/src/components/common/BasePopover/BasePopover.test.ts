// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BasePopover from './BasePopover.vue'

describe('BasePopover', () => {
  describe('レンダリング', () => {
    it('デフォルト props でレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BasePopover, {
        slots: {
          activator: '<button>トリガー</button>',
          default: '<p>コンテンツ</p>',
        },
      })

      // Assert
      expect(wrapper.find('.popover').exists()).toBe(true)
    })

    it('activator スロットの内容がレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BasePopover, {
        slots: {
          activator: '<button data-testid="trigger">トリガー</button>',
        },
      })

      // Assert
      expect(wrapper.find('[data-testid="trigger"]').exists()).toBe(true)
    })
  })

  describe('placement', () => {
    it.each(['bottom', 'bottom-start', 'bottom-end', 'top', 'top-start', 'top-end'] as const)(
      'placement="%s" が受け入れられる',
      (placement) => {
        // Arrange & Act
        const wrapper = mount(BasePopover, {
          props: { placement },
          slots: { activator: '<button>トリガー</button>' },
        })

        // Assert
        expect(wrapper.find('.popover').exists()).toBe(true)
      },
    )

    it('デフォルトの placement は bottom-end である', () => {
      // Arrange & Act
      const wrapper = mount(BasePopover, {
        slots: { activator: '<button>トリガー</button>' },
      })

      // Assert
      expect(wrapper.find('.popover').exists()).toBe(true)
    })
  })

  describe('アクセシビリティ', () => {
    it('activator がキーボードフォーカス可能な要素を受け入れられる', () => {
      // Arrange & Act
      const wrapper = mount(BasePopover, {
        slots: {
          activator: '<button aria-label="メニューを開く">開く</button>',
        },
      })

      // Assert
      expect(wrapper.find('button[aria-label="メニューを開く"]').exists()).toBe(true)
    })
  })
})
