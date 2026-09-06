import type { Meta, StoryObj } from '@storybook/vue3';
import BaseStepper from '@/components/common/BaseStepper/BaseStepper.vue';

const meta: Meta<typeof BaseStepper> = {
  title: 'Common/BaseStepper',
  component: BaseStepper,
  tags: ['autodocs'],
  args: {
    steps: ['候補日選択', '参加者選択', '確認'],
    current: 1,
    label: '開催を追加する手順',
  },
  argTypes: {
    current: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstStep: Story = {
  args: { current: 1 },
};

export const MiddleStep: Story = {
  args: { current: 2 },
};

export const LastStep: Story = {
  args: { current: 3 },
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseStepper },
    template: `
      <div style="display: flex; flex-direction: column; gap: 32px; width: 480px;">
        <BaseStepper :steps="['候補日選択', '参加者選択', '確認']" :current="1" />
        <BaseStepper :steps="['候補日選択', '参加者選択', '確認']" :current="2" />
        <BaseStepper :steps="['候補日選択', '参加者選択', '確認']" :current="3" />
      </div>
    `,
  }),
};
