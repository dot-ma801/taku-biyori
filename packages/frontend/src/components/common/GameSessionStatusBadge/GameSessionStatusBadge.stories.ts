import type { Meta, StoryObj } from '@storybook/vue3';
import { GameSessionStatus } from '@taku-biyori/shared';
import GameSessionStatusBadge from '@/components/common/GameSessionStatusBadge/GameSessionStatusBadge.vue';

/** 開催が取りうるステータス（design-v2 §4-2 で導出される4つ） */
const GAME_SESSION_STATUSES = [
  GameSessionStatus.scheduled,
  GameSessionStatus.today,
  GameSessionStatus.completed,
  GameSessionStatus.cancelled,
];

const meta: Meta<typeof GameSessionStatusBadge> = {
  title: 'Common/GameSessionStatusBadge',
  component: GameSessionStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: GAME_SESSION_STATUSES,
    },
  },
  args: {
    status: GameSessionStatus.scheduled,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Scheduled: Story = {
  args: { status: GameSessionStatus.scheduled },
};
export const Today: Story = { args: { status: GameSessionStatus.today } };
export const Completed: Story = {
  args: { status: GameSessionStatus.completed },
};
export const Cancelled: Story = {
  args: { status: GameSessionStatus.cancelled },
};

export const AllStatuses: Story = {
  render: () => ({
    components: { GameSessionStatusBadge },
    setup: () => ({ statuses: GAME_SESSION_STATUSES }),
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <GameSessionStatusBadge v-for="s in statuses" :key="s" :status="s" />
      </div>
    `,
  }),
};
