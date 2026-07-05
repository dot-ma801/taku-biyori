import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';

const meta: Meta<typeof BaseTextBox> = {
  title: 'Form/BaseTextBox',
  component: BaseTextBox,
  tags: ['autodocs'],
  args: {
    label: '',
    placeholder: '',
    hint: '',
    type: 'text',
    disabled: false,
    readonly: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'ユーザー名', placeholder: '入力してください' },
  render: (args) => ({
    components: { BaseTextBox },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template:
      '<BaseTextBox v-bind="args" v-model="value" style="max-width: 320px;" />',
  }),
};

export const WithHint: Story = {
  args: {
    label: 'メールアドレス',
    placeholder: 'example@email.com',
    hint: '登録済みのメールアドレスを入力してください',
    type: 'email',
  },
  render: (args) => ({
    components: { BaseTextBox },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template:
      '<BaseTextBox v-bind="args" v-model="value" style="max-width: 320px;" />',
  }),
};

export const WithValidation: Story = {
  args: { label: 'パスワード', type: 'password' },
  render: (args) => ({
    components: { BaseTextBox },
    setup() {
      const value = ref('');
      const rules = [
        (v: string) => v.length >= 8 || '8文字以上で入力してください',
      ];
      return { args, value, rules };
    },
    template:
      '<BaseTextBox v-bind="args" v-model="value" :rules="rules" style="max-width: 320px;" />',
  }),
};

export const Disabled: Story = {
  args: { label: '無効フィールド', disabled: true },
  render: (args) => ({
    components: { BaseTextBox },
    setup() {
      const value = ref('編集できません');
      return { args, value };
    },
    template:
      '<BaseTextBox v-bind="args" v-model="value" style="max-width: 320px;" />',
  }),
};

export const Required: Story = {
  args: { label: 'タイトル', required: true },
  render: (args) => ({
    components: { BaseTextBox },
    setup() {
      const value = ref('');
      return { args, value };
    },
    template:
      '<BaseTextBox v-bind="args" v-model="value" style="max-width: 320px;" />',
  }),
};

export const Readonly: Story = {
  args: { label: '読み取り専用', readonly: true },
  render: (args) => ({
    components: { BaseTextBox },
    setup() {
      const value = ref('読み取り専用の値');
      return { args, value };
    },
    template:
      '<BaseTextBox v-bind="args" v-model="value" style="max-width: 320px;" />',
  }),
};
