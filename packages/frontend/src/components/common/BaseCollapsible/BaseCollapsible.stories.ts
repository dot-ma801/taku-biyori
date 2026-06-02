import type { Meta, StoryObj } from '@storybook/vue3';
import BaseCollapsible from '@/components/common/BaseCollapsible/BaseCollapsible.vue';

const meta: Meta<typeof BaseCollapsible> = {
  title: 'Common/BaseCollapsible',
  component: BaseCollapsible,
  tags: ['autodocs'],
  args: {
    title: 'セクションタイトル',
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseCollapsible },
    setup: () => ({ args }),
    template: `
      <BaseCollapsible v-bind="args" style="max-width: 400px;">
        開閉可能なコンテンツがここに入ります。クリックして開閉できます。
      </BaseCollapsible>
    `,
  }),
};

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
  render: (args) => ({
    components: { BaseCollapsible },
    setup: () => ({ args }),
    template: `
      <BaseCollapsible v-bind="args" style="max-width: 400px;">
        最初から開いた状態のコンテンツです。
      </BaseCollapsible>
    `,
  }),
};

export const Multiple: Story = {
  render: () => ({
    components: { BaseCollapsible },
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px;">
        <BaseCollapsible title="セクション 1" :default-open="true">
          セクション1のコンテンツです。
        </BaseCollapsible>
        <BaseCollapsible title="セクション 2">
          セクション2のコンテンツです。
        </BaseCollapsible>
        <BaseCollapsible title="セクション 3">
          セクション3のコンテンツです。
        </BaseCollapsible>
      </div>
    `,
  }),
};
