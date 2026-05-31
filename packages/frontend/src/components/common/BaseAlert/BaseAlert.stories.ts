import type { Meta, StoryObj } from '@storybook/vue3'
import BaseAlert from './BaseAlert.vue'

const meta: Meta<typeof BaseAlert> = {
  title: 'Common/BaseAlert',
  component: BaseAlert,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
    onDismiss: { action: 'dismiss' },
  },
  args: {
    variant: 'info',
    title: '',
    dismissible: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { variant: 'info', title: 'お知らせ' },
  render: (args) => ({
    components: { BaseAlert },
    setup: () => ({ args }),
    template: '<BaseAlert v-bind="args">これは情報メッセージです。</BaseAlert>',
  }),
}

export const Success: Story = {
  args: { variant: 'success', title: '成功' },
  render: (args) => ({
    components: { BaseAlert },
    setup: () => ({ args }),
    template: '<BaseAlert v-bind="args">操作が正常に完了しました。</BaseAlert>',
  }),
}

export const Warning: Story = {
  args: { variant: 'warning', title: '警告' },
  render: (args) => ({
    components: { BaseAlert },
    setup: () => ({ args }),
    template: '<BaseAlert v-bind="args">この操作には注意が必要です。</BaseAlert>',
  }),
}

export const Error: Story = {
  args: { variant: 'error', title: 'エラー' },
  render: (args) => ({
    components: { BaseAlert },
    setup: () => ({ args }),
    template: '<BaseAlert v-bind="args">エラーが発生しました。</BaseAlert>',
  }),
}

export const Dismissible: Story = {
  args: { variant: 'info', title: '閉じられるアラート', dismissible: true },
  render: (args) => ({
    components: { BaseAlert },
    setup: () => ({ args }),
    template: '<BaseAlert v-bind="args">×ボタンで閉じられます。</BaseAlert>',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { BaseAlert },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 480px;">
        <BaseAlert variant="info" title="情報">情報メッセージです。</BaseAlert>
        <BaseAlert variant="success" title="成功">成功メッセージです。</BaseAlert>
        <BaseAlert variant="warning" title="警告">警告メッセージです。</BaseAlert>
        <BaseAlert variant="error" title="エラー">エラーメッセージです。</BaseAlert>
      </div>
    `,
  }),
}
