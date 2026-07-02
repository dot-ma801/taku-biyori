import type { Meta, StoryObj } from '@storybook/vue3';
import PageContainer from '@/components/layout/PageContainer/PageContainer.vue';

const meta: Meta<typeof PageContainer> = {
  title: 'Layout/PageContainer',
  component: PageContainer,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['md', 'lg'] },
  },
  args: {
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { PageContainer },
    setup: () => ({ args }),
    template: `
      <PageContainer v-bind="args">
        <div style="background: var(--color-surface); border: 1px dashed var(--color-border); padding: 16px;">
          ページのコンテンツがここに入ります。コンテナは中央寄せされ、最大幅を超えると左右に余白が生まれます。
        </div>
      </PageContainer>
    `,
  }),
};

export const Large: Story = {
  args: { size: 'lg' },
  render: (args) => ({
    components: { PageContainer },
    setup: () => ({ args }),
    template: `
      <PageContainer v-bind="args">
        <div style="background: var(--color-surface); border: 1px dashed var(--color-border); padding: 16px;">
          size="lg" では一覧やテーブルなど幅を使う画面向けに最大幅が広がります。
        </div>
      </PageContainer>
    `,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    components: { PageContainer },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <PageContainer size="md">
          <div style="background: var(--color-surface); border: 1px dashed var(--color-border); padding: 16px;">
            md（最大幅 960px）
          </div>
        </PageContainer>
        <PageContainer size="lg">
          <div style="background: var(--color-surface); border: 1px dashed var(--color-border); padding: 16px;">
            lg（最大幅 1200px）
          </div>
        </PageContainer>
      </div>
    `,
  }),
};
