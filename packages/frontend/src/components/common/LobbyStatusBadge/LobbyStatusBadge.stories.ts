import type { Meta, StoryObj } from '@storybook/vue3';
import { LobbyStatus } from '@taku-biyori/shared';
import LobbyStatusBadge from '@/components/common/LobbyStatusBadge/LobbyStatusBadge.vue';

const meta: Meta<typeof LobbyStatusBadge> = {
  title: 'Common/LobbyStatusBadge',
  component: LobbyStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(LobbyStatus),
    },
  },
  args: {
    status: LobbyStatus.open,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Draft: Story = { args: { status: LobbyStatus.draft } };
export const Open: Story = { args: { status: LobbyStatus.open } };
export const Closed: Story = { args: { status: LobbyStatus.closed } };
export const Disbanded: Story = { args: { status: LobbyStatus.disbanded } };

export const AllStatuses: Story = {
  render: () => ({
    components: { LobbyStatusBadge },
    setup: () => ({ statuses: Object.values(LobbyStatus) }),
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <LobbyStatusBadge v-for="s in statuses" :key="s" :status="s" />
      </div>
    `,
  }),
};
