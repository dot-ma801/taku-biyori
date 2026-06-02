import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import BaseSwitch from '@/components/form/BaseSwitch/BaseSwitch.vue';

const meta: Meta<typeof BaseSwitch> = {
  title: 'Form/BaseSwitch',
  component: BaseSwitch,
  tags: ['autodocs'],
  args: {
    label: 'スイッチ',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseSwitch },
    setup() {
      const value = ref(false);
      return { args, value };
    },
    template: '<BaseSwitch v-bind="args" v-model="value" />',
  }),
};

export const On: Story = {
  render: (args) => ({
    components: { BaseSwitch },
    setup() {
      const value = ref(true);
      return { args, value };
    },
    template: '<BaseSwitch v-bind="args" v-model="value" />',
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { BaseSwitch },
    setup() {
      const value = ref(false);
      return { args, value };
    },
    template: '<BaseSwitch v-bind="args" v-model="value" />',
  }),
};

export const Group: Story = {
  render: () => ({
    components: { BaseSwitch },
    setup() {
      const settings = ref([
        { label: '通知を受け取る', value: true },
        { label: 'メールを受け取る', value: false },
        { label: 'ダークモード', value: false },
      ]);
      return { settings };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <BaseSwitch
          v-for="s in settings"
          :key="s.label"
          :label="s.label"
          v-model="s.value"
        />
      </div>
    `,
  }),
};
