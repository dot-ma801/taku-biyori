import type { Meta, StoryObj } from '@storybook/vue3';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';

const meta: Meta<typeof BaseDatePicker> = {
  title: 'Form/BaseDatePicker',
  component: BaseDatePicker,
  tags: ['autodocs'],
  args: {
    label: '開催日',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseDatePicker },
    setup: () => ({ args }),
    template: '<BaseDatePicker v-bind="args" />',
  }),
};

export const WithValue: Story = {
  args: {
    label: '開催日',
    modelValue: '2025-12-25',
  },
  render: (args) => ({
    components: { BaseDatePicker },
    setup: () => ({ args }),
    template: '<BaseDatePicker v-bind="args" />',
  }),
};

export const WithMinMax: Story = {
  args: {
    label: '開催日',
    min: '2025-01-01',
    max: '2025-12-31',
  },
  render: (args) => ({
    components: { BaseDatePicker },
    setup: () => ({ args }),
    template: '<BaseDatePicker v-bind="args" />',
  }),
};

export const Disabled: Story = {
  args: {
    label: '開催日',
    disabled: true,
  },
  render: (args) => ({
    components: { BaseDatePicker },
    setup: () => ({ args }),
    template: '<BaseDatePicker v-bind="args" />',
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseDatePicker },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 320px;">
        <BaseDatePicker label="通常" />
        <BaseDatePicker label="選択済み" model-value="2025-06-15" />
        <BaseDatePicker label="無効" disabled />
      </div>
    `,
  }),
};
