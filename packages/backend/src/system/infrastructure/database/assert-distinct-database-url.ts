/**
 * `TEST_DATABASE_URL` が `DATABASE_URL`（開発用 DB）と同じ接続先を指していないか検証する。
 *
 * 同一だと、テスト用に用意したつもりのマイグレーション適用・`withCommitted` の
 * 後片付け DELETE などが開発用データベースに対してそのまま実行されてしまう。
 * ポート省略時の既定値やクエリパラメータの違いに惑わされないよう、
 * host（小文字化）+ port + pathname（データベース名）だけを正規化して比較する。
 */
export const assertDistinctFromDatabaseUrl = (
  testDatabaseUrl: string,
  databaseUrl: string | undefined,
): void => {
  // 開発用 DB の接続先が設定されていなければ比較のしようがない（例: CI で
  // DATABASE_URL を使わない構成）ため、その場合はチェックをスキップする。
  if (!databaseUrl) {
    return;
  }

  if (normalize(testDatabaseUrl) === normalize(databaseUrl)) {
    throw new Error(
      [
        'TEST_DATABASE_URL が DATABASE_URL と同じ接続先を指しています。',
        'このまま実行すると開発用データベースにマイグレーションが適用されたり、',
        'テストのトランザクション・DELETE が開発用データを巻き込みます。',
        'TEST_DATABASE_URL には開発用とは別名のデータベース（例: taku_biyori_test）を指定してください。',
      ].join('\n'),
    );
  }
};

const normalize = (rawUrl: string): string => {
  const url = new URL(rawUrl);
  const port = url.port || '5432';
  return `${url.hostname.toLowerCase()}:${port}${url.pathname}`;
};
