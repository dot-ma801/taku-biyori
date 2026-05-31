import type { Meta, StoryObj } from '@storybook/vue3'
import BaseToastContainer from './BaseToastContainer.vue'
import BaseButton from '@/components/button/BaseButton.vue'
import { useToast } from '@/composables/useToast'

const meta: Meta<typeof BaseToastContainer> = {
  title: 'Common/BaseToastContainer',
  component: BaseToastContainer,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { BaseToastContainer, BaseButton },
    setup() {
      const toast = useToast()
      return { toast }
    },
    template: `
      <div style="padding: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
        <BaseButton @click="toast.info('情報メッセージです')">Info</BaseButton>
        <BaseButton @click="toast.success('成功しました！')">Success</BaseButton>
        <BaseButton variant="secondary" @click="toast.warning('警告があります')">Warning</BaseButton>
        <BaseButton variant="ghost" @click="toast.error('エラーが発生しました')">Error</BaseButton>
        <BaseToastContainer />
      </div>
    `,
  }),
}
