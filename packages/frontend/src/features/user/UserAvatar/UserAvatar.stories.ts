import type { Meta, StoryObj } from '@storybook/vue3';
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';

const meta: Meta<typeof UserAvatar> = {
  title: 'User/UserAvatar',
  component: UserAvatar,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['marble', 'beam', 'pixel', 'sunset', 'ring', 'bauhaus'],
    },
    size: { control: 'number' },
  },
  args: {
    size: 30,
    variant: 'beam',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: 60 },
};

export const AllVariants: Story = {
  render: () => ({
    components: { UserAvatar },
    template: `
      <div style="display: flex; gap: 12px; align-items: center;">
        <UserAvatar variant="marble" />
        <UserAvatar variant="beam" />
        <UserAvatar variant="pixel" />
        <UserAvatar variant="sunset" />
        <UserAvatar variant="ring" />
        <UserAvatar variant="bauhaus" />
      </div>
    `,
  }),
};
