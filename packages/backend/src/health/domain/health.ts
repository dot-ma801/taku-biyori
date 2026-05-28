import type { HealthResponse } from '@taku-biyori/shared';

/**
 * 疎通確認のドメインモデルです。
 * 単純な値オブジェクトにしておくことで、テストでは副作用なしで検証できます。
 */
export type HealthStatus = HealthResponse;

/**
 * 疎通確認レスポンスを生成します。
 */
export const createHealthStatus = (): HealthStatus => ({
  status: 'ok',
  message: 'Backend is running',
});
