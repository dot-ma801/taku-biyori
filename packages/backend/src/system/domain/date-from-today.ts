/**
 * `YYYY-MM-DD` 形式で今日からの相対日付を作る（サーバのローカル日付基準）。
 *
 * `scripts/seed.ts`（開発データ作成）と `test/helpers/fixtures.ts`
 * （実 DB テストのフィクスチャ）の双方で使うため、`src/` 側に置いて
 * `@/` 経由で共有する。片方だけ直すと境界テスト（今日・過去日・未来日）が
 * 静かに壊れるため、実装は必ずここ一箇所に保つこと。
 */
export const dateFromToday = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};
