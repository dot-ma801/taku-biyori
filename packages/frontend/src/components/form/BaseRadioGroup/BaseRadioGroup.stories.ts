import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import BaseRadioGroup from '@/components/form/BaseRadioGroup/BaseRadioGroup.vue';

const sampleOptions = [
  { value: 'option1', label: 'オプション 1' },
  { value: 'option2', label: 'オプション 2' },
  { value: 'option3', label: 'オプション 3 (無効)', disabled: true },
];

const meta: Meta<typeof BaseRadioGroup> = {
  title: 'Form/BaseRadioGroup',
  component: BaseRadioGroup,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['column', 'row'] },
  },
  args: {
    options: sampleOptions,
    label: 'オプション選択',
    disabled: false,
    direction: 'column',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseRadioGroup },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template: '<BaseRadioGroup v-bind="args" v-model="value" />',
  }),
};

export const Row: Story = {
  args: { direction: 'row' },
  render: (args) => ({
    components: { BaseRadioGroup },
    setup() {
      const value = ref('option1');
      return { args, value };
    },
    template: '<BaseRadioGroup v-bind="args" v-model="value" />',
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { BaseRadioGroup },
    setup() {
      const value = ref('option1');
      return { args, value };
    },
    template: '<BaseRadioGroup v-bind="args" v-model="value" />',
  }),
};
