import type { Meta, StoryObj } from '@storybook/vue3';
import BaseDialog from '@/components/dialog/BaseDialog.vue';

const meta: Meta<typeof BaseDialog> = {
  title: 'Dialog/BaseDialog',
  component: BaseDialog,
  tags: ['autodocs'],
  args: {
    title: 'ダイアログタイトル',
    description: '',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: '確認', description: 'この操作を実行してもよいですか？' },
  render: (args) => ({
    components: { BaseDialog },
    setup: () => ({ args }),
    template: `
      <BaseDialog v-bind="args">
        <template #activator>
          <button style="padding: 8px 16px; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ダイアログを開く
          </button>
        </template>
        ダイアログの本文コンテンツです。
      </BaseDialog>
    `,
  }),
};

export const WithActions: Story = {
  args: {
    title: '削除の確認',
    description: 'このアイテムを削除しますか？この操作は元に戻せません。',
  },
  render: (args) => ({
    components: { BaseDialog },
    setup: () => ({ args }),
    template: `
      <BaseDialog v-bind="args">
        <template #activator>
          <button style="padding: 8px 16px; background: #e24a4a; color: white; border: none; border-radius: 4px; cursor: pointer;">
            削除する
          </button>
        </template>
        <template #actions>
          <button style="padding: 6px 16px; background: #e24a4a; color: white; border: none; border-radius: 4px; cursor: pointer;">
            削除する
          </button>
        </template>
      </BaseDialog>
    `,
  }),
};
