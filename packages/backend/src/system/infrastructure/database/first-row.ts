/**
 * `INSERT ... RETURNING` の結果配列から1件目を取り出す。
 *
 * `rows[0]!` の非null断定は、想定外に0件だったときに理由の分からない
 * `undefined is not an object` 系のエラーになり原因調査が難しい。
 * 代わりにここで何を取得しようとしていたか（`what`）を含めた意味のある
 * エラーを投げる。
 */
export const firstRow = <T>(rows: T[], what: string): T => {
  const row = rows[0];

  if (row === undefined) {
    throw new Error(`${what} の取得結果が0件でした`);
  }

  return row;
};
