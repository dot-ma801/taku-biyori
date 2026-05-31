import type { Meta, StoryObj } from '@storybook/vue3'
import BaseBadge from './BaseBadge.vue'

const meta: Meta<typeof BaseBadge> = {
  title: 'Common/BaseBadge',
  component: BaseBadge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'primary', 'success', 'warning', 'error'] },
  },
  args: {
    variant: 'default',
    dot: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { variant: 'default' },
  render: (args) => ({
    components: { BaseBadge },
    setup: () => ({ args }),
    template: '<BaseBadge v-bind="args">デフォルト</BaseBadge>',
  }),
}

export const Primary: Story = {
  args: { variant: 'primary' },
  render: (args) => ({
    components: { BaseBadge },
    setup: () => ({ args }),
    template: '<BaseBadge v-bind="args">プライマリ</BaseBadge>',
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { BaseBadge },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <BaseBadge variant="default">Default</BaseBadge>
        <BaseBadge variant="primary">Primary</BaseBadge>
        <BaseBadge variant="success">Success</BaseBadge>
        <BaseBadge variant="warning">Warning</BaseBadge>
        <BaseBadge variant="error">Error</BaseBadge>
      </div>
    `,
  }),
}

export const DotVariants: Story = {
  render: () => ({
    components: { BaseBadge },
    template: `
      <div style="display: flex; gap: 12px; align-items: center;">
        <BaseBadge variant="default" :dot="true" />
        <BaseBadge variant="primary" :dot="true" />
        <BaseBadge variant="success" :dot="true" />
        <BaseBadge variant="warning" :dot="true" />
        <BaseBadge variant="error" :dot="true" />
      </div>
    `,
  }),
}
