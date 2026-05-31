import type { Meta, StoryObj } from '@storybook/vue3'
import { CircleUser } from '@lucide/vue'
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

export const Default: Story = {
  render: (args) => ({
    components: { BasePopover, CircleUser },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <BasePopover v-bind="args">
          <template #activator>
            <CircleUser :size="32" aria-label="アカウントメニューを開く" />
          </template>
          <ul style="list-style: none; margin: 0; padding: 0;">
            <li style="padding: 12px 16px; cursor: pointer; font-size: 13px;">ログイン / サインイン</li>
          </ul>
        </BasePopover>
      </div>
    `,
  }),
}

export const WithMultipleItems: Story = {
  render: (args) => ({
    components: { BasePopover, CircleUser },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; justify-content: flex-end; padding: 16px;">
        <BasePopover v-bind="args">
          <template #activator>
            <CircleUser :size="32" aria-label="アカウントメニューを開く" />
          </template>
          <ul style="list-style: none; margin: 0; padding: 0;">
            <li style="padding: 12px 16px; cursor: pointer; font-size: 13px;">プロフィール</li>
            <li style="padding: 12px 16px; cursor: pointer; font-size: 13px; border-top: 1px solid var(--color-border);">設定</li>
            <li style="padding: 12px 16px; cursor: pointer; font-size: 13px; border-top: 1px solid var(--color-border); color: var(--color-error);">ログアウト</li>
          </ul>
        </BasePopover>
      </div>
    `,
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { BasePopover, CircleUser },
    template: `
      <div style="display: flex; gap: 32px; justify-content: center; padding: 16px;">
        <BasePopover placement="bottom-end">
          <template #activator>
            <CircleUser :size="32" aria-label="アカウントメニュー（右寄せ）" />
          </template>
          <ul style="list-style: none; margin: 0; padding: 0;">
            <li style="padding: 12px 16px; font-size: 13px;">ログイン / サインイン</li>
          </ul>
        </BasePopover>
        <BasePopover placement="bottom-start">
          <template #activator>
            <CircleUser :size="32" aria-label="アカウントメニュー（左寄せ）" />
          </template>
          <ul style="list-style: none; margin: 0; padding: 0;">
            <li style="padding: 12px 16px; font-size: 13px;">ログイン / サインイン</li>
          </ul>
        </BasePopover>
      </div>
    `,
  }),
}
