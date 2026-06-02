import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import BaseCheckbox from '@/components/form/BaseCheckbox/BaseCheckbox.vue';

const meta: Meta<typeof BaseCheckbox> = {
  title: 'Form/BaseCheckbox',
  component: BaseCheckbox,
  tags: ['autodocs'],
  args: {
    label: 'チェックボックス',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseCheckbox },
    setup() {
      const checked = ref(false);
      return { args, checked };
    },
    template: '<BaseCheckbox v-bind="args" v-model="checked" />',
  }),
};

export const Checked: Story = {
  render: (args) => ({
    components: { BaseCheckbox },
    setup() {
      const checked = ref(true);
      return { args, checked };
    },
    template: '<BaseCheckbox v-bind="args" v-model="checked" />',
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { BaseCheckbox },
    setup() {
      const checked = ref(false);
      return { args, checked };
    },
    template: '<BaseCheckbox v-bind="args" v-model="checked" />',
  }),
};

export const Group: Story = {
  render: () => ({
    components: { BaseCheckbox },
    setup() {
      const options = ref([
        { label: 'Vue.js', checked: true },
        { label: 'TypeScript', checked: false },
        { label: 'Storybook', checked: false },
      ]);
      return { options };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <BaseCheckbox
          v-for="opt in options"
          :key="opt.label"
          :label="opt.label"
          v-model="opt.checked"
        />
      </div>
    `,
  }),
};
