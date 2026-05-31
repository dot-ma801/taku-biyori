import type { Meta, StoryObj } from '@storybook/vue3'
import BaseCard from './BaseCard.vue'

const meta: Meta<typeof BaseCard> = {
  title: 'Common/BaseCard',
  component: BaseCard,
  tags: ['autodocs'],
  args: {
    title: '',
    subtitle: '',
    noPadding: false,
    hoverable: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: 'カードタイトル', subtitle: 'サブタイトル' },
  render: (args) => ({
    components: { BaseCard },
    setup: () => ({ args }),
    template: `
      <BaseCard v-bind="args" style="max-width: 360px;">
        カードの本文コンテンツがここに入ります。
      </BaseCard>
    `,
  }),
}

export const WithActions: Story = {
  args: { title: 'アクション付きカード' },
  render: (args) => ({
    components: { BaseCard },
    setup: () => ({ args }),
    template: `
      <BaseCard v-bind="args" style="max-width: 360px;">
        カードの本文コンテンツがここに入ります。
        <template #actions>
          <button style="padding: 6px 12px; cursor: pointer;">キャンセル</button>
          <button style="padding: 6px 12px; cursor: pointer; background: #4a90e2; color: white; border: none; border-radius: 4px;">確認</button>
        </template>
      </BaseCard>
    `,
  }),
}

export const Hoverable: Story = {
  args: { title: 'ホバー可能カード', hoverable: true },
  render: (args) => ({
    components: { BaseCard },
    setup: () => ({ args }),
    template: `
      <BaseCard v-bind="args" style="max-width: 360px;">
        ホバーするとシャドウが強くなります。
      </BaseCard>
    `,
  }),
}

export const NoPadding: Story = {
  args: { title: 'パディングなし', noPadding: true },
  render: (args) => ({
    components: { BaseCard },
    setup: () => ({ args }),
    template: `
      <BaseCard v-bind="args" style="max-width: 360px;">
        <div style="padding: 20px; background: #f0f0f0;">カスタムパディングのコンテンツ</div>
      </BaseCard>
    `,
  }),
}
