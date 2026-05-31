import type { Meta, StoryObj } from '@storybook/vue3'
import BaseDivider from './BaseDivider.vue'

const meta: Meta<typeof BaseDivider> = {
  title: 'Common/BaseDivider',
  component: BaseDivider,
  tags: ['autodocs'],
  args: {
    label: '',
    vertical: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: (args) => ({
    components: { BaseDivider },
    setup: () => ({ args }),
    template: `
      <div style="padding: 16px; max-width: 400px;">
        <p>上のコンテンツ</p>
        <BaseDivider v-bind="args" style="margin: 12px 0;" />
        <p>下のコンテンツ</p>
      </div>
    `,
  }),
}

export const WithLabel: Story = {
  args: { label: 'または' },
  render: (args) => ({
    components: { BaseDivider },
    setup: () => ({ args }),
    template: `
      <div style="padding: 16px; max-width: 400px;">
        <p>上のコンテンツ</p>
        <BaseDivider v-bind="args" style="margin: 12px 0;" />
        <p>下のコンテンツ</p>
      </div>
    `,
  }),
}

export const Vertical: Story = {
  args: { vertical: true },
  render: (args) => ({
    components: { BaseDivider },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; align-items: center; gap: 12px; height: 40px;">
        <span>左</span>
        <BaseDivider v-bind="args" />
        <span>右</span>
      </div>
    `,
  }),
}
