import type { Meta, StoryObj } from '@storybook/vue3';
import { GameSessionStatus } from '@taku-biyori/shared';
import GameSessionStatusBadge from './GameSessionStatusBadge.vue';

const meta: Meta<typeof GameSessionStatusBadge> = {
  title: 'Common/GameSessionStatusBadge',
  component: GameSessionStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(GameSessionStatus),
    },
  },
  args: {
    status: GameSessionStatus.open,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Draft: Story = { args: { status: GameSessionStatus.draft } };
export const Open: Story = { args: { status: GameSessionStatus.open } };
export const Scheduling: Story = { args: { status: GameSessionStatus.scheduling } };
export const Confirmed: Story = { args: { status: GameSessionStatus.confirmed } };
export const Today: Story = { args: { status: GameSessionStatus.today } };
export const Completed: Story = { args: { status: GameSessionStatus.completed } };

export const AllStatuses: Story = {
  render: () => ({
    components: { GameSessionStatusBadge },
    setup: () => ({ statuses: Object.values(GameSessionStatus) }),
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <GameSessionStatusBadge v-for="s in statuses" :key="s" :status="s" />
      </div>
    `,
  }),
};
