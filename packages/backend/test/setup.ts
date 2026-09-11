/**
 * Vitest の setupFiles。
 *
 * リポジトリ層のテストは実 DB へ接続するため、`.env` の `TEST_DATABASE_URL` を
 * ワーカープロセスの `process.env` に載せる。CI では `.env` が存在せず workflow の
 * `env` が既に入っているため、dotenv は何もしない（既存の環境変数は上書きしない）。
 */
import 'dotenv/config';
