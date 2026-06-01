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

export const Stretch: Story = {
  render: () => ({
    components: { BaseTabs },
    setup() {
      const tabs = [
        { value: 'tab1', label: 'タブ 1' },
        { value: 'tab2', label: 'タブ 2' },
      ]
      return { tabs }
    },
    template: `
      <BaseTabs :tabs="tabs" stretch style="max-width: 500px;">
        <template #tab1>タブ1のコンテンツです。</template>
        <template #tab2>タブ2のコンテンツです。</template>
      </BaseTabs>
    `,
  }),
}

export const FixedHeight: Story = {
  render: () => ({
    components: { BaseTabs },
    setup() {
      const tabs = [
        { value: 'tab1', label: 'タブ 1' },
        { value: 'tab2', label: 'タブ 2' },
      ]
      return { tabs }
    },
    template: `
      <BaseTabs :tabs="tabs" fixed-height style="max-width: 500px;">
        <template #tab1><p>短いコンテンツ</p></template>
        <template #tab2>
          <p>長いコンテンツ</p>
          <p>複数行にわたるテキストが入ります。</p>
          <p>タブを切り替えてもタブバーの位置が変わらないことを確認できます。</p>
        </template>
      </BaseTabs>
    `,
  }),
}

export const StretchAndFixedHeight: Story = {
  render: () => ({
    components: { BaseTabs },
    setup() {
      const tabs = [
        { value: 'tab1', label: 'ログイン' },
        { value: 'tab2', label: '新規作成' },
      ]
      return { tabs }
    },
    template: `
      <BaseTabs :tabs="tabs" stretch fixed-height style="max-width: 400px;">
        <template #tab1><p>ログインフォーム（短め）</p></template>
        <template #tab2>
          <p>新規作成フォーム（長め）</p>
          <p>ユーザー名</p>
          <p>メールアドレス</p>
          <p>パスワード</p>
        </template>
      </BaseTabs>
    `,
  }),
}
