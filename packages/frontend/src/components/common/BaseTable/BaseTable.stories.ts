import type { Meta, StoryObj } from '@storybook/vue3';
import BaseTable from '@/components/common/BaseTable/BaseTable.vue';
import type { TableColumn } from '@/components/common/BaseTable/BaseTable.vue';

type SampleRow = {
  name: string;
  role: string;
  status: string;
  score: number;
};

const columns: TableColumn[] = [
  { key: 'name', label: '名前', sortable: true },
  { key: 'role', label: '役割' },
  { key: 'status', label: 'ステータス', align: 'center' },
  { key: 'score', label: 'スコア', align: 'right', sortable: true },
];

const rows: SampleRow[] = [
  { name: '田中 太郎', role: 'ホスト', status: '参加中', score: 42 },
  { name: '鈴木 花子', role: 'プレイヤー', status: '待機中', score: 35 },
  { name: '佐藤 次郎', role: 'プレイヤー', status: '参加中', score: 28 },
];

const meta: Meta<typeof BaseTable> = {
  title: 'Common/BaseTable',
  component: BaseTable,
  tags: ['autodocs'],
  argTypes: {
    striped: { control: 'boolean' },
    hoverable: { control: 'boolean' },
  },
  args: {
    columns,
    rows,
    striped: false,
    hoverable: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Striped: Story = {
  args: { striped: true },
};

export const Hoverable: Story = {
  args: { hoverable: true },
};

export const Empty: Story = {
  args: { rows: [] },
};

export const CustomCell: Story = {
  render: (args) => ({
    components: { BaseTable },
    setup: () => ({ args, columns, rows }),
    template: `
      <BaseTable v-bind="args">
        <template #cell-status="{ value }">
          <span :style="{ color: value === '参加中' ? 'var(--color-success)' : 'var(--color-text-muted)' }">
            {{ value }}
          </span>
        </template>
      </BaseTable>
    `,
  }),
};

export const Sortable: Story = {
  args: { columns },
};

export const AllVariants: Story = {
  render: () => ({
    components: { BaseTable },
    setup: () => ({ columns, rows }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div>
          <p style="margin-bottom: 8px; font-weight: 600;">デフォルト（ソートあり）</p>
          <BaseTable :columns="columns" :rows="rows" />
        </div>
        <div>
          <p style="margin-bottom: 8px; font-weight: 600;">ストライプ</p>
          <BaseTable :columns="columns" :rows="rows" :striped="true" />
        </div>
        <div>
          <p style="margin-bottom: 8px; font-weight: 600;">空テーブル</p>
          <BaseTable :columns="columns" :rows="[]" />
        </div>
      </div>
    `,
  }),
};
