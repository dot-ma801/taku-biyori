import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import BaseSelect from '@/components/form/BaseSelect/BaseSelect.vue';

const sampleOptions = [
  { value: 'apple', label: 'りんご' },
  { value: 'banana', label: 'バナナ' },
  { value: 'cherry', label: 'チェリー', disabled: true },
  { value: 'grape', label: 'ぶどう' },
];

const meta: Meta<typeof BaseSelect> = {
  title: 'Form/BaseSelect',
  component: BaseSelect,
  tags: ['autodocs'],
  args: {
    options: sampleOptions,
    placeholder: '選択してください',
    label: '',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'フルーツを選択' },
  render: (args) => ({
    components: { BaseSelect },
    setup() {
      const value = ref<string>();
      return { args, value };
    },
    template:
      '<BaseSelect v-bind="args" v-model="value" style="max-width: 280px;" />',
  }),
};

export const WithSelection: Story = {
  args: { label: 'フルーツを選択' },
  render: (args) => ({
    components: { BaseSelect },
    setup() {
      const value = ref('banana');
      return { args, value };
    },
    template:
      '<BaseSelect v-bind="args" v-model="value" style="max-width: 280px;" />',
  }),
};

export const Disabled: Story = {
  args: { label: '無効セレクト', disabled: true },
  render: (args) => ({
    components: { BaseSelect },
    setup() {
      const value = ref<string>();
      return { args, value };
    },
    template:
      '<BaseSelect v-bind="args" v-model="value" style="max-width: 280px;" />',
  }),
};
