import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';

const meta: Meta<typeof BaseChip> = {
  title: 'Common/BaseChip',
  component: BaseChip,
  tags: ['autodocs'],
  args: {
    selected: false,
    removable: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { BaseChip },
    setup: () => ({ args }),
    template: '<BaseChip v-bind="args">チップ</BaseChip>',
  }),
};

export const Selected: Story = {
  args: { selected: true },
  render: (args) => ({
    components: { BaseChip },
    setup: () => ({ args }),
    template: '<BaseChip v-bind="args">選択済み</BaseChip>',
  }),
};

export const Removable: Story = {
  args: { removable: true },
  render: (args) => ({
    components: { BaseChip },
    setup: () => ({ args }),
    template: '<BaseChip v-bind="args">削除可能</BaseChip>',
  }),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => ({
    components: { BaseChip },
    setup: () => ({ args }),
    template: '<BaseChip v-bind="args">無効</BaseChip>',
  }),
};

export const Interactive: Story = {
  render: () => ({
    components: { BaseChip },
    setup() {
      const chips = ref([
        { label: 'Vue', selected: true },
        { label: 'TypeScript', selected: false },
        { label: 'Storybook', selected: false },
      ]);
      const toggle = (i: number) => {
        chips.value[i]!.selected = !chips.value[i]!.selected;
      };
      return { chips, toggle };
    },
    template: `
      <div style="display: flex; gap: 8px;">
        <BaseChip
          v-for="(chip, i) in chips"
          :key="chip.label"
          :selected="chip.selected"
          @update:selected="toggle(i)"
        >{{ chip.label }}</BaseChip>
      </div>
    `,
  }),
};
