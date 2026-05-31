import type { Meta, StoryObj } from '@storybook/vue3'
import BaseProgress from './BaseProgress.vue'

const meta: Meta<typeof BaseProgress> = {
  title: 'Common/BaseProgress',
  component: BaseProgress,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
  args: {
    value: 60,
    max: 100,
    indeterminate: false,
    variant: 'default',
    size: 'md',
    showValue: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: 60, label: 'アップロード中' },
  render: (args) => ({
    components: { BaseProgress },
    setup: () => ({ args }),
    template: '<BaseProgress v-bind="args" style="max-width: 400px;" />',
  }),
}

export const WithValue: Story = {
  args: { value: 75, label: '完了率', showValue: true },
  render: (args) => ({
    components: { BaseProgress },
    setup: () => ({ args }),
    template: '<BaseProgress v-bind="args" style="max-width: 400px;" />',
  }),
}

export const Indeterminate: Story = {
  args: { indeterminate: true, label: '処理中...' },
  render: (args) => ({
    components: { BaseProgress },
    setup: () => ({ args }),
    template: '<BaseProgress v-bind="args" style="max-width: 400px;" />',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { BaseProgress },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <BaseProgress :value="60" label="Default" variant="default" :show-value="true" />
        <BaseProgress :value="80" label="Success" variant="success" :show-value="true" />
        <BaseProgress :value="50" label="Warning" variant="warning" :show-value="true" />
        <BaseProgress :value="30" label="Error" variant="error" :show-value="true" />
      </div>
    `,
  }),
}

export const Sizes: Story = {
  render: () => ({
    components: { BaseProgress },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 400px;">
        <BaseProgress :value="60" label="Small" size="sm" />
        <BaseProgress :value="60" label="Medium" size="md" />
      </div>
    `,
  }),
}
