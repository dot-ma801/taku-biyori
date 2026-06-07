// このファイルを編集するときは README の「単体テスト項目」も更新が必要か確認してください。
// → ./README.md

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseTable from '@/components/common/BaseTable/BaseTable.vue';

const columns = [
  { key: 'name', label: '名前', sortable: true },
  { key: 'score', label: 'スコア', align: 'right' as const, sortable: true },
];
const rows = [
  { name: '田中', score: 10 },
  { name: '鈴木', score: 20 },
];

describe('BaseTable', () => {
  describe('レンダリング', () => {
    it('デフォルト props でテーブルがレンダリングされる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      expect(wrapper.find('.table').exists()).toBe(true);
    });

    it('カラムヘッダーが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      const headers = wrapper.findAll('.table__th');
      expect(headers).toHaveLength(2);
      expect(headers[0]!.text()).toBe('名前');
      expect(headers[1]!.text()).toBe('スコア');
    });

    it('行データが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      const cells = wrapper.findAll('.table__td');
      expect(cells[0]!.text()).toBe('田中');
      expect(cells[1]!.text()).toBe('10');
    });
  });

  describe('rows が空のとき', () => {
    it('空メッセージが表示される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows: [] } });

      // Assert
      expect(wrapper.find('.table__empty').exists()).toBe(true);
      expect(wrapper.find('.table__empty').text()).toBe('データがありません');
    });

    it('empty スロットで内容を上書きできる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, {
        props: { columns, rows: [] },
        slots: { empty: '該当なし' },
      });

      // Assert
      expect(wrapper.find('.table__empty').text()).toBe('該当なし');
    });
  });

  describe('striped', () => {
    it('striped=true のとき偶数行に table__row--striped クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, {
        props: { columns, rows, striped: true },
      });

      // Assert
      const dataRows = wrapper.findAll('.table__body .table__row');
      expect(dataRows[0]!.classes()).not.toContain('table__row--striped');
      expect(dataRows[1]!.classes()).toContain('table__row--striped');
    });

    it('striped=false のとき table__row--striped クラスが付与されない', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, {
        props: { columns, rows, striped: false },
      });

      // Assert
      const dataRows = wrapper.findAll('.table__body .table__row');
      dataRows.forEach((row) => {
        expect(row.classes()).not.toContain('table__row--striped');
      });
    });
  });

  describe('hoverable', () => {
    it('hoverable=true のとき table__row--hoverable クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, {
        props: { columns, rows, hoverable: true },
      });

      // Assert
      const dataRows = wrapper.findAll('.table__body .table__row');
      dataRows.forEach((row) => {
        expect(row.classes()).toContain('table__row--hoverable');
      });
    });
  });

  describe('align', () => {
    it('align=right のカラムに table__th--right クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      const headers = wrapper.findAll('.table__th');
      expect(headers[1]!.classes()).toContain('table__th--right');
    });

    it('align 未指定のカラムに table__th--left クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      const headers = wrapper.findAll('.table__th');
      expect(headers[0]!.classes()).toContain('table__th--left');
    });
  });

  describe('カスタムセル', () => {
    it('cell-{key} スロットでセルの内容を上書きできる', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, {
        props: { columns, rows },
        slots: { 'cell-name': '<span class="custom">カスタム</span>' },
      });

      // Assert
      expect(wrapper.find('.custom').exists()).toBe(true);
    });
  });

  describe('ソート', () => {
    it('sortable=true のカラムヘッダーに table__th--sortable クラスが付与される', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      const headers = wrapper.findAll('.table__th');
      expect(headers[0]!.classes()).toContain('table__th--sortable');
    });

    it('sortable=false のカラムヘッダーに table__th--sortable クラスが付与されない', () => {
      // Arrange
      const colsWithoutSort = [
        { key: 'name', label: '名前' },
        { key: 'score', label: 'スコア' },
      ];

      // Act
      const wrapper = mount(BaseTable, {
        props: { columns: colsWithoutSort, rows },
      });

      // Assert
      const headers = wrapper.findAll('.table__th');
      expect(headers[0]!.classes()).not.toContain('table__th--sortable');
    });

    it('ソートヘッダーをクリックすると昇順に並び替えられる', async () => {
      // Arrange
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Act
      await wrapper.findAll('.table__th')[1]!.trigger('click'); // score 昇順

      // Assert
      const cells = wrapper.findAll('.table__td');
      expect(cells[1]!.text()).toBe('10'); // 最初の行の score が小さい方
    });

    it('同じヘッダーを2回クリックすると降順になる', async () => {
      // Arrange
      const wrapper = mount(BaseTable, { props: { columns, rows } });
      const scoreHeader = wrapper.findAll('.table__th')[1]!;

      // Act
      await scoreHeader.trigger('click'); // 昇順
      await scoreHeader.trigger('click'); // 降順

      // Assert
      const cells = wrapper.findAll('.table__td');
      expect(cells[1]!.text()).toBe('20'); // 最初の行の score が大きい方
    });

    it('同じヘッダーを3回クリックするとソートが解除される', async () => {
      // Arrange
      const wrapper = mount(BaseTable, { props: { columns, rows } });
      const scoreHeader = wrapper.findAll('.table__th')[1]!;

      // Act
      await scoreHeader.trigger('click'); // 昇順
      await scoreHeader.trigger('click'); // 降順
      await scoreHeader.trigger('click'); // 解除

      // Assert
      const cells = wrapper.findAll('.table__td');
      expect(cells[1]!.text()).toBe('10'); // 元の順序
    });

    it('ソート中のカラムに aria-sort 属性が付与される', async () => {
      // Arrange
      const wrapper = mount(BaseTable, { props: { columns, rows } });
      const scoreHeader = wrapper.findAll('.table__th')[1]!;

      // Act
      await scoreHeader.trigger('click');

      // Assert
      expect(scoreHeader.attributes('aria-sort')).toBe('ascending');
    });

    it('降順ソート中は aria-sort="descending" が付与される', async () => {
      // Arrange
      const wrapper = mount(BaseTable, { props: { columns, rows } });
      const scoreHeader = wrapper.findAll('.table__th')[1]!;

      // Act
      await scoreHeader.trigger('click'); // 昇順
      await scoreHeader.trigger('click'); // 降順

      // Assert
      expect(scoreHeader.attributes('aria-sort')).toBe('descending');
    });
  });

  describe('アクセシビリティ', () => {
    it('ラッパーに role="region" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      expect(wrapper.find('[role="region"]').exists()).toBe(true);
    });

    it('th に scope="col" が付与されている', () => {
      // Arrange & Act
      const wrapper = mount(BaseTable, { props: { columns, rows } });

      // Assert
      const headers = wrapper.findAll('th');
      headers.forEach((th) => {
        expect(th.attributes('scope')).toBe('col');
      });
    });
  });
});
