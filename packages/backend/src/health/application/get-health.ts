import {
  HealthResponseSchema,
  type HealthResponse,
} from '@taku-biyori/shared';
import { createHealthStatus } from '@/health/domain/health';

/**
 * 疎通確認のユースケースです。
 * 共有スキーマで検証して、返却契約のズレを早めに検知します。
 */
export const getHealth = (): HealthResponse => {
  return HealthResponseSchema.parse(createHealthStatus());
};
