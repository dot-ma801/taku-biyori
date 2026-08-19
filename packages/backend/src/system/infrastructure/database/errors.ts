/**
 * PostgreSQL の一意制約違反（SQLSTATE 23505）かどうかを判定します。
 *
 * INSERT は `onConflictDoNothing()` で衝突を表現できますが、UPDATE には
 * ON CONFLICT がないため、衝突を「エラーではない結果」として扱いたい箇所では
 * この判定でエラーを握り替えます。
 */
export const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error as { code?: unknown }).code === '23505';
