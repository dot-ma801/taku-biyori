const UNIQUE_VIOLATION = '23505';

const hasUniqueViolationCode = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  'code' in value &&
  (value as { code?: unknown }).code === UNIQUE_VIOLATION;

/**
 * PostgreSQL の一意制約違反（SQLSTATE 23505）かどうかを判定します。
 *
 * INSERT は `onConflictDoNothing()` で衝突を表現できますが、UPDATE には
 * ON CONFLICT がないため、衝突を「エラーではない結果」として扱いたい箇所では
 * この判定でエラーを握り替えます。
 *
 * Drizzle は postgres-js の `PostgresError` を自前のエラーで包んで投げるため、
 * 最上位のエラーだけを見ても SQLSTATE は取れません。`cause` を辿って判定します
 * （循環参照で無限ループしないよう深さを制限します）。
 */
export const isUniqueViolation = (error: unknown): boolean => {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (hasUniqueViolationCode(current)) return true;
    current =
      typeof current === 'object' && current !== null && 'cause' in current
        ? (current as { cause?: unknown }).cause
        : null;
  }

  return false;
};
