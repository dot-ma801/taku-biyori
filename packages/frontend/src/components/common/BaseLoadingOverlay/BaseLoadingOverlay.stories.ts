import type { Meta, StoryObj } from '@storybook/vue3';
import BaseLoadingOverlay from '@/components/common/BaseLoadingOverlay/BaseLoadingOverlay.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import { useLoading } from '@/composables/useLoading';

const meta: Meta<typeof BaseLoadingOverlay> = {
  title: 'Common/BaseLoadingOverlay',
  component: BaseLoadingOverlay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { BaseLoadingOverlay, BaseButton },
    setup() {
      const { start, stop, withLoading } = useLoading();

      const showForAWhile = (message?: string) =>
        withLoading(
          () => new Promise((resolve) => setTimeout(resolve, 2000)),
          message,
        );

      return { start, stop, showForAWhile };
    },
    template: `
      <div style="padding: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
        <BaseButton @click="showForAWhile()">既定の文言で 2 秒表示</BaseButton>
        <BaseButton variant="secondary" @click="showForAWhile('Google に接続しています…')">
          メッセージ付きで 2 秒表示
        </BaseButton>
        <BaseButton variant="ghost" @click="start('手動で表示中…')">表示する</BaseButton>
        <BaseButton variant="ghost" @click="stop()">閉じる</BaseButton>
        <BaseLoadingOverlay />
      </div>
    `,
  }),
};

export const WithMessage: Story = {
  render: () => ({
    components: { BaseLoadingOverlay, BaseButton },
    setup() {
      const { start, stop } = useLoading();
      start('ログインしています…');
      return { stop };
    },
    template: `
      <div style="padding: 16px;">
        <BaseButton variant="ghost" @click="stop()">閉じる</BaseButton>
        <BaseLoadingOverlay />
      </div>
    `,
  }),
};
