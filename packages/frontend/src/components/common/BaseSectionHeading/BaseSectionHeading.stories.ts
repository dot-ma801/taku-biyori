import type { Meta, StoryObj } from '@storybook/vue3';
import { BookOpenText, NotebookPen, Settings } from '@lucide/vue';
import BaseSectionHeading from './BaseSectionHeading.vue';

const meta: Meta<typeof BaseSectionHeading> = {
  title: 'Common/BaseSectionHeading',
  component: BaseSectionHeading,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
    iconColor: {
      control: 'select',
      options: ['primary', 'default'],
    },
  },
  args: {
    level: 'h2',
    iconColor: 'primary',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { icon: NotebookPen },
  render: (args) => ({
    components: { BaseSectionHeading },
    setup: () => ({ args }),
    template: `<BaseSectionHeading v-bind="args">基本情報</BaseSectionHeading>`,
  }),
};

export const SubSection: Story = {
  args: { level: 'h5', icon: BookOpenText },
  render: (args) => ({
    components: { BaseSectionHeading },
    setup: () => ({ args }),
    template: `<BaseSectionHeading v-bind="args">シナリオ情報</BaseSectionHeading>`,
  }),
};

export const WithoutIcon: Story = {
  render: (args) => ({
    components: { BaseSectionHeading },
    setup: () => ({ args }),
    template: `<BaseSectionHeading v-bind="args">アイコンなし見出し</BaseSectionHeading>`,
  }),
};

export const IconColorDefault: Story = {
  args: { icon: Settings, iconColor: 'default' },
  render: (args) => ({
    components: { BaseSectionHeading },
    setup: () => ({ args }),
    template: `<BaseSectionHeading v-bind="args">デフォルトカラー</BaseSectionHeading>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseSectionHeading },
    setup: () => ({ NotebookPen, BookOpenText, Settings }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <BaseSectionHeading level="h1" :icon="NotebookPen">h1 見出し</BaseSectionHeading>
        <BaseSectionHeading level="h2" :icon="NotebookPen">h2 見出し</BaseSectionHeading>
        <BaseSectionHeading level="h3" :icon="Settings">h3 見出し</BaseSectionHeading>
        <BaseSectionHeading level="h5" :icon="BookOpenText">h5 見出し</BaseSectionHeading>
        <BaseSectionHeading level="h2" :icon="Settings" iconColor="default">デフォルトカラー</BaseSectionHeading>
        <BaseSectionHeading level="h2">アイコンなし見出し</BaseSectionHeading>
      </div>
    `,
  }),
};
