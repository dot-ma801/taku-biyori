import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3';
import AvailabilityResponse from '@/components/common/AvailabilityResponse/AvailabilityResponse.vue';

const meta: Meta<typeof AvailabilityResponse> = {
  title: 'Common/AvailabilityResponse',
  component: AvailabilityResponse,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { AvailabilityResponse },
    setup() {
      const value = ref<'maru' | 'sankaku' | 'batsu' | null>(null);
      return { value };
    },
    template: '<AvailabilityResponse v-model="value" />',
  }),
};

export const Preselected: Story = {
  render: () => ({
    components: { AvailabilityResponse },
    setup() {
      const value = ref<'maru' | 'sankaku' | 'batsu' | null>('maru');
      return { value };
    },
    template: '<AvailabilityResponse v-model="value" />',
  }),
};

export const Large: Story = {
  render: () => ({
    components: { AvailabilityResponse },
    setup() {
      const value = ref<'maru' | 'sankaku' | 'batsu' | null>('sankaku');
      return { value };
    },
    template: '<AvailabilityResponse v-model="value" :size="56" />',
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { AvailabilityResponse },
    setup() {
      const value = ref<'maru' | 'sankaku' | 'batsu' | null>('batsu');
      return { value };
    },
    template: '<AvailabilityResponse v-model="value" disabled />',
  }),
};
