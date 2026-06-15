export enum GameSessionStatus {
  /** 非公開 */
  draft = 'draft',
  /** 募集中 */
  open = 'open',
  /** 日程調整中 */
  scheduling = 'scheduling',
  /** 実施前 */
  confirmed = 'confirmed',
  /** 当日 */
  today = 'today',
  /** 通過済み */
  completed = 'completed',
}
