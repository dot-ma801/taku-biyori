import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';

export type LobbyStatusBadgeVariant =
  | 'muted'
  | 'primary'
  | 'warning'
  | 'success'
  | 'error';

/** design-v2 §4-1 の「日本語」列に揃える */
const LABEL_MAP: Record<LobbyStatus, string> = {
  [LobbyStatus.draft]: '下書き',
  [LobbyStatus.open]: '受付中',
  [LobbyStatus.closed]: '受付終了',
  [LobbyStatus.disbanded]: '解散',
};

const VARIANT_MAP: Record<LobbyStatus, LobbyStatusBadgeVariant> = {
  [LobbyStatus.draft]: 'muted',
  [LobbyStatus.open]: 'primary',
  [LobbyStatus.closed]: 'warning',
  [LobbyStatus.disbanded]: 'error',
};

/**
 * バッジの表示（ラベル・バリアント）をステータスから導出する。
 * コンポーネントの責務はテンプレートの構造制御に限るため、対応表はここに置く。
 */
export const useLobbyStatusBadge = (status: MaybeRefOrGetter<LobbyStatus>) => ({
  label: computed(() => LABEL_MAP[toValue(status)]),
  variant: computed(() => VARIANT_MAP[toValue(status)]),
});
