import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import BaseTextArea from './BaseTextArea.vue'

const meta: Meta<typeof BaseTextArea> = {
  title: 'Form/BaseTextArea',
  component: BaseTextArea,
  tags: ['autodocs'],
  argTypes: {
    resize: { control: 'select', options: ['none', 'vertical', 'horizontal', 'both'] },
  },
  args: {
    label: '',
    placeholder: '',
    hint: '',
    rows: 4,
    disabled: false,
    readonly: false,
    resize: 'vertical',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: 'コメント', placeholder: 'コメントを入力してください' },
  render: (args) => ({
    components: { BaseTextArea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<BaseTextArea v-bind="args" v-model="value" style="max-width: 400px;" />',
  }),
}

export const WithHint: Story = {
  args: { label: '自己紹介', hint: '500文字以内で入力してください', rows: 5 },
  render: (args) => ({
    components: { BaseTextArea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: '<BaseTextArea v-bind="args" v-model="value" style="max-width: 400px;" />',
  }),
}

export const WithValidation: Story = {
  args: { label: '必須コメント' },
  render: (args) => ({
    components: { BaseTextArea },
    setup() {
      const value = ref('')
      const rules = [(v: string) => v.length > 0 || 'コメントは必須です']
      return { args, value, rules }
    },
    template: '<BaseTextArea v-bind="args" v-model="value" :rules="rules" style="max-width: 400px;" />',
  }),
}

export const Disabled: Story = {
  args: { label: '無効フィールド', disabled: true },
  render: (args) => ({
    components: { BaseTextArea },
    setup() {
      const value = ref('編集できないテキストです。')
      return { args, value }
    },
    template: '<BaseTextArea v-bind="args" v-model="value" style="max-width: 400px;" />',
  }),
}
