export enum GameSessionStatus {
  /** 非公開 */
  draft = 'draft',
  /**
   * 募集中。
   * 卓では導出されず、`PATCH /:id/status` の公開遷移（`draft → open`）の
   * リクエスト値としてのみ使う（design-v1.1 §8・段階6b/6c）。
   */
  open = 'open',
  /** 実施前 */
  confirmed = 'confirmed',
  /** 当日 */
  today = 'today',
  /** 通過済み */
  completed = 'completed',
  /** 中止 */
  cancelled = 'cancelled',
}
