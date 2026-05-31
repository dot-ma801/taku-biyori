import type { Meta, StoryObj } from '@storybook/vue3'
import BaseTabs from './BaseTabs.vue'

const meta: Meta<typeof BaseTabs> = {
  title: 'Common/BaseTabs',
  component: BaseTabs,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { BaseTabs },
    setup() {
      const tabs = [
        { value: 'tab1', label: 'タブ 1' },
        { value: 'tab2', label: 'タブ 2' },
        { value: 'tab3', label: 'タブ 3' },
      ]
      return { tabs }
    },
    template: `
      <BaseTabs :tabs="tabs" style="max-width: 500px;">
        <template #tab1>タブ1のコンテンツです。</template>
        <template #tab2>タブ2のコンテンツです。</template>
        <template #tab3>タブ3のコンテンツです。</template>
      </BaseTabs>
    `,
  }),
}

export const WithDisabledTab: Story = {
  render: () => ({
    components: { BaseTabs },
    setup() {
      const tabs = [
        { value: 'tab1', label: 'タブ 1' },
        { value: 'tab2', label: 'タブ 2 (無効)', disabled: true },
        { value: 'tab3', label: 'タブ 3' },
      ]
      return { tabs }
    },
    template: `
      <BaseTabs :tabs="tabs" style="max-width: 500px;">
        <template #tab1>タブ1のコンテンツです。</template>
        <template #tab2>このタブは無効です。</template>
        <template #tab3>タブ3のコンテンツです。</template>
      </BaseTabs>
    `,
  }),
}
