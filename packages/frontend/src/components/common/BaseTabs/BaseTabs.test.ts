// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTabs from './BaseTabs.vue'

const sampleTabs = [
  { value: 'overview', label: '概要' },
  { value: 'details', label: '詳細' },
  { value: 'settings', label: '設定', disabled: true },
]

describe('BaseTabs', () => {
  describe('レンダリング', () => {
    it('tabs の数だけタブボタンが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTabs, { props: { tabs: sampleTabs } })

      // Assert
      expect(wrapper.findAll('.tabs__item')).toHaveLength(3)
    })

    it('各タブの label がボタンテキストとして表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTabs, { props: { tabs: sampleTabs } })

      // Assert
      const items = wrapper.findAll('.tabs__item')
      expect(items[0].text()).toBe('概要')
      expect(items[1].text()).toBe('詳細')
      expect(items[2].text()).toBe('設定')
    })
  })

  describe('disabled', () => {
    it('disabled=true のタブに disabled 属性が付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTabs, { props: { tabs: sampleTabs } })

      // Assert
      const settingsTab = wrapper.findAll('.tabs__item')[2]
      expect(settingsTab.attributes('disabled')).toBeDefined()
    })
  })

  describe('slots', () => {
    it('アクティブタブに対応する名前付きスロットのコンテンツが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTabs, {
        props: { tabs: sampleTabs, modelValue: 'overview' },
        slots: { overview: '<p class="overview-content">概要コンテンツ</p>' },
      })

      // Assert
      expect(wrapper.find('.overview-content').exists()).toBe(true)
    })
  })

  describe('アクセシビリティ', () => {
    it('label prop が aria-label としてタブリストに付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTabs, {
        props: { tabs: sampleTabs, label: 'コンテンツナビゲーション' },
      })

      // Assert
      expect(wrapper.find('.tabs__list').attributes('aria-label')).toBe('コンテンツナビゲーション')
    })

    it('タブリストに role="tablist" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseTabs, { props: { tabs: sampleTabs } })

      // Assert
      expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    })
  })
})
