/**
 * `db:seed` の接続先がローカルの DB であることを検証する。
 *
 * `tsx scripts/seed.ts` は通常 `NODE_ENV` が未設定のまま実行されるため、
 * `NODE_ENV === 'production'` のチェックだけでは実質ノーガードになる。
 * seed は既存データを削除してから作り直すため、誤って本番相当の DB に
 * 向けて実行するとデータが失われる。DATABASE_URL の host がローカル
 * （localhost / 127.0.0.1 / ::1）でなければ弾き、意図的にリモート DB へ
 * 実行したい場合だけ `allowRemote` で明示的に解除できるようにする。
 */
// URL.hostname は IPv6 リテラルを `[::1]` のように角括弧つきで返すため、
// 括弧ありのキーで登録しておく。
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export const assertLocalDatabaseUrl = (
  databaseUrl: string,
  allowRemote: boolean,
): void => {
  if (allowRemote) {
    return;
  }

  const host = new URL(databaseUrl).hostname;

  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(
      [
        `db:seed の接続先 (${host}) がローカルの DB ではありません。`,
        'このスクリプトは既存のシードデータを削除してから作り直すため、',
        '誤って本番相当の DB に向けて実行するとデータが失われます。',
        '意図的にリモート DB へ実行する場合は SEED_ALLOW_REMOTE=1 を指定してください。',
      ].join('\n'),
    );
  }
};
