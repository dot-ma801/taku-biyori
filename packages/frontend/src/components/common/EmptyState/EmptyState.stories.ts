import type { Meta, StoryObj } from '@storybook/vue3';
import { Inbox } from '@lucide/vue';
import EmptyState from '@/components/common/EmptyState/EmptyState.vue';
import BaseButton from '@/components/button/BaseButton.vue';

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { EmptyState, BaseButton },
    setup: () => ({ Inbox }),
    template: `
      <EmptyState :icon="Inbox" title="まだ卓がありません" description="最初の卓を作って、仲間を誘ってみましょう。">
        <BaseButton>卓を作る</BaseButton>
      </EmptyState>
    `,
  }),
};

export const NoIcon: Story = {
  render: () => ({
    components: { EmptyState },
    template:
      '<EmptyState title="該当する結果がありません" description="条件を変えてもう一度お試しください。" />',
  }),
};
