import { z } from 'zod';

/**
 * バックエンドの疎通確認レスポンスを表すスキーマです。
 * UI 側でも同じ形を検証できるように共有します。
 */
export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  message: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
