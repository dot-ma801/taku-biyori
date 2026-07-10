import type { Meta, StoryObj } from '@storybook/vue3';
import SessionCard from '@/components/common/SessionCard/SessionCard.vue';

const meta: Meta<typeof SessionCard> = {
  title: 'Common/SessionCard',
  component: SessionCard,
  tags: ['autodocs'],
  args: {
    title: '闇夜のクトゥルフ',
    dateLabel: '7月20日（日）19:00〜',
    location: '新宿・ボードゲームカフェ',
    status: 'recruiting',
    slotsLabel: 'あと2枠',
    members: ['あ', 'い', 'う'],
    tag: 'クトゥルフ',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { SessionCard },
    setup: () => ({ args }),
    template:
      '<div style="max-width: 380px;"><SessionCard v-bind="args" /></div>',
  }),
};

export const Full: Story = {
  args: { status: 'full', slotsLabel: '満席' },
  render: (args) => ({
    components: { SessionCard },
    setup: () => ({ args }),
    template:
      '<div style="max-width: 380px;"><SessionCard v-bind="args" /></div>',
  }),
};

export const Confirmed: Story = {
  args: { status: 'confirmed', slotsLabel: '開催決定' },
  render: (args) => ({
    components: { SessionCard },
    setup: () => ({ args }),
    template:
      '<div style="max-width: 380px;"><SessionCard v-bind="args" /></div>',
  }),
};

export const ManyMembers: Story = {
  args: {
    members: ['あ', 'い', 'う', 'え', 'お', 'か'],
  },
  render: (args) => ({
    components: { SessionCard },
    setup: () => ({ args }),
    template:
      '<div style="max-width: 380px;"><SessionCard v-bind="args" /></div>',
  }),
};
