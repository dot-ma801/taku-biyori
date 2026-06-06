import type { Meta, StoryObj } from '@storybook/vue3';
import BaseDateTimePicker from './BaseDateTimePicker.vue';

const meta: Meta<typeof BaseDateTimePicker> = {
  title: 'Form/BaseDateTimePicker',
  component: BaseDateTimePicker,
  tags: ['autodocs'],
  args: {
    label: '開催日時',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseDateTimePicker },
    setup: () => ({ args }),
    template: '<BaseDateTimePicker v-bind="args" />',
  }),
};

export const WithHint: Story = {
  args: {
    label: '開催日時',
    hint: '開催予定の日時を入力してください',
  },
  render: (args) => ({
    components: { BaseDateTimePicker },
    setup: () => ({ args }),
    template: '<BaseDateTimePicker v-bind="args" />',
  }),
};

export const WithValidation: Story = {
  args: {
    label: '開催日時',
    rules: [(v: unknown) => !!v || '日時を入力してください'],
  },
  render: (args) => ({
    components: { BaseDateTimePicker },
    setup: () => ({ args }),
    template: '<BaseDateTimePicker v-bind="args" />',
  }),
};

export const Disabled: Story = {
  args: {
    label: '開催日時',
    disabled: true,
  },
  render: (args) => ({
    components: { BaseDateTimePicker },
    setup: () => ({ args }),
    template: '<BaseDateTimePicker v-bind="args" />',
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseDateTimePicker },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 320px;">
        <BaseDateTimePicker label="通常" />
        <BaseDateTimePicker label="ヒントあり" hint="開催予定の日時を入力してください" />
        <BaseDateTimePicker label="無効" disabled />
      </div>
    `,
  }),
};
