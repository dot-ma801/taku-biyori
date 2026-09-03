import type { Meta, StoryObj } from '@storybook/vue3';
import BaseBreadcrumb from '@/components/common/BaseBreadcrumb/BaseBreadcrumb.vue';

const meta: Meta<typeof BaseBreadcrumb> = {
  title: 'Common/BaseBreadcrumb',
  component: BaseBreadcrumb,
  tags: ['autodocs'],
  args: {
    items: [
      { label: 'ダッシュボード', to: '/dashboard' },
      { label: '週末のマーダーミステリー', to: '/lobbies/lobby-1' },
      { label: '開催の詳細' },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseBreadcrumb },
    setup: () => ({ args }),
    template: '<BaseBreadcrumb v-bind="args" />',
  }),
};

export const 現在地のみ: Story = {
  args: {
    items: [{ label: 'ロビーの詳細' }],
  },
  render: (args) => ({
    components: { BaseBreadcrumb },
    setup: () => ({ args }),
    template: '<BaseBreadcrumb v-bind="args" />',
  }),
};

export const 長いラベル: Story = {
  args: {
    items: [
      { label: 'ダッシュボード', to: '/dashboard' },
      {
        label: '週末に集まってやる予定のマーダーミステリーのロビーです',
        to: '/lobbies/lobby-1',
      },
      { label: 'プレイメモ' },
    ],
  },
  render: (args) => ({
    components: { BaseBreadcrumb },
    setup: () => ({ args }),
    template:
      '<div style="max-width: 320px;"><BaseBreadcrumb v-bind="args" /></div>',
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseBreadcrumb },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <BaseBreadcrumb :items="[{ label: 'ロビーの詳細' }]" />
        <BaseBreadcrumb
          :items="[
            { label: 'ダッシュボード', to: '/dashboard' },
            { label: '週末のロビー' },
          ]"
        />
        <BaseBreadcrumb
          :items="[
            { label: 'ダッシュボード', to: '/dashboard' },
            { label: '週末のロビー', to: '/lobbies/lobby-1' },
            { label: 'プレイメモ' },
          ]"
        />
      </div>
    `,
  }),
};
