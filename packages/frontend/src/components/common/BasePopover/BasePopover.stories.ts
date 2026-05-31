import type { Meta, StoryObj } from '@storybook/vue3'
import BasePopover from './BasePopover.vue'

const meta: Meta<typeof BasePopover> = {
  title: 'Common/BasePopover',
  component: BasePopover,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['bottom', 'bottom-start', 'bottom-end', 'top', 'top-start', 'top-end'],
    },
  },
  args: {
    placement: 'bottom-end',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const menuItemStyle = `
  display: block;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-base);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: background-color 0.15s;
`

export const WithClickableItems: Story = {
  render: (args) => ({
    components: { BasePopover },
    setup: () => ({ args, menuItemStyle }),
    template: `
      <div style="display: flex; justify-content: center; padding: 32px;">
        <BasePopover v-bind="args">
          <template #activator>
            <button style="padding: 6px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; background: var(--color-surface); font-family: var(--font-family-base); font-size: 13px;">
              メニューを開く
            </button>
          </template>
          <div style="padding: 4px 0;">
            <button :style="menuItemStyle" @mouseover="e => e.target.style.background='var(--color-surface-raised)'" @mouseleave="e => e.target.style.background='none'" @click="() => {}">項目 A</button>
            <button :style="menuItemStyle" @mouseover="e => e.target.style.background='var(--color-surface-raised)'" @mouseleave="e => e.target.style.background='none'" @click="() => {}">項目 B</button>
            <button :style="menuItemStyle" @mouseover="e => e.target.style.background='var(--color-surface-raised)'" @mouseleave="e => e.target.style.background='none'" @click="() => {}">項目 C</button>
          </div>
        </BasePopover>
      </div>
    `,
  }),
}

export const AllPlacements: Story = {
  render: () => ({
    components: { BasePopover },
    setup() {
      return {
        topPlacements: ['top-start', 'top', 'top-end'],
        bottomPlacements: ['bottom-start', 'bottom', 'bottom-end'],
      }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 0; height: 320px; justify-content: space-between; padding: 0 64px;">
        <!-- top 系: 十分な上方向スペースを確保するため下寄りに配置 -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; flex: 1; padding-bottom: 0; margin-top: auto;">
          <BasePopover v-for="p in topPlacements" :key="p" :placement="p">
            <template #activator>
              <button style="padding: 4px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; background: var(--color-surface); font-size: 12px; font-family: var(--font-family-base);">
                {{ p }}
              </button>
            </template>
            <div style="padding: 8px 16px; font-size: 13px; font-family: var(--font-family-base);">コンテンツ</div>
          </BasePopover>
        </div>
        <!-- bottom 系: 十分な下方向スペースを確保するため上寄りに配置 -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex: 1; padding-top: 0; margin-bottom: auto;">
          <BasePopover v-for="p in bottomPlacements" :key="p" :placement="p">
            <template #activator>
              <button style="padding: 4px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; background: var(--color-surface); font-size: 12px; font-family: var(--font-family-base);">
                {{ p }}
              </button>
            </template>
            <div style="padding: 8px 16px; font-size: 13px; font-family: var(--font-family-base);">コンテンツ</div>
          </BasePopover>
        </div>
      </div>
    `,
  }),
}
