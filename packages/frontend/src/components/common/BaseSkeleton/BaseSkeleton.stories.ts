import type { Meta, StoryObj } from '@storybook/vue3';
import BaseSkeleton from '@/components/common/BaseSkeleton/BaseSkeleton.vue';

const meta: Meta<typeof BaseSkeleton> = {
  title: 'Common/BaseSkeleton',
  component: BaseSkeleton,
  tags: ['autodocs'],
  argTypes: {
    rounded: { control: 'select', options: ['sm', 'md', 'full'] },
  },
  args: {
    rounded: 'sm',
    lines: 1,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { width: '200px', height: '14px' },
  render: (args) => ({
    components: { BaseSkeleton },
    setup: () => ({ args }),
    template: '<BaseSkeleton v-bind="args" />',
  }),
};

export const Circle: Story = {
  args: { width: '40px', height: '40px', rounded: 'full' },
  render: (args) => ({
    components: { BaseSkeleton },
    setup: () => ({ args }),
    template: '<BaseSkeleton v-bind="args" />',
  }),
};

export const MultipleLines: Story = {
  args: { lines: 3, height: '14px' },
  render: (args) => ({
    components: { BaseSkeleton },
    setup: () => ({ args }),
    template: '<BaseSkeleton v-bind="args" style="max-width: 300px;" />',
  }),
};

export const CardPlaceholder: Story = {
  render: () => ({
    components: { BaseSkeleton },
    template: `
      <div style="padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 320px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <BaseSkeleton width="40px" height="40px" rounded="full" />
          <div style="flex: 1; display: flex; flex-direction: column; gap: 6px;">
            <BaseSkeleton width="120px" height="14px" />
            <BaseSkeleton width="80px" height="12px" />
          </div>
        </div>
        <BaseSkeleton :lines="3" height="14px" />
      </div>
    `,
  }),
};
