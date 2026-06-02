import type { Meta, StoryObj } from '@storybook/vue3';
import BaseButton from '@/components/button/BaseButton.vue';

const meta: Meta<typeof BaseButton> = {
  title: 'Button/BaseButton',
  component: BaseButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    type: 'button',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">ボタン</BaseButton>',
  }),
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">ボタン</BaseButton>',
  }),
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">ボタン</BaseButton>',
  }),
};

export const Small: Story = {
  args: { size: 'sm' },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">小さいボタン</BaseButton>',
  }),
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">ロード中</BaseButton>',
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { BaseButton },
    setup: () => ({ args }),
    template: '<BaseButton v-bind="args">無効</BaseButton>',
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseButton },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <BaseButton variant="primary">Primary</BaseButton>
        <BaseButton variant="secondary">Secondary</BaseButton>
        <BaseButton variant="ghost">Ghost</BaseButton>
        <BaseButton variant="primary" size="sm">Small</BaseButton>
        <BaseButton variant="primary" :loading="true">Loading</BaseButton>
        <BaseButton variant="primary" :disabled="true">Disabled</BaseButton>
      </div>
    `,
  }),
};
