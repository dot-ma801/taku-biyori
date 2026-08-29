import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import {
  type LucideIcon,
  EyeOff,
  Megaphone,
  CalendarClock,
  Ban,
} from '@lucide/vue';

export type StatusAppearance = {
  label: string;
  text: string;
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error';
  icon: LucideIcon;
};

const STATUS_APPEARANCE: Record<LobbyStatus, StatusAppearance> = {
  [LobbyStatus.draft]: {
    label: '非公開',
    text: 'まだ公開していません。準備ができたら公開しましょう。',
    variant: 'default',
    icon: EyeOff,
  },
  [LobbyStatus.open]: {
    label: '募集中',
    text: '参加者を募集しています。',
    variant: 'primary',
    icon: Megaphone,
  },
  [LobbyStatus.closed]: {
    label: '受付終了',
    text: '新しい参加の受付を終了しています。追加募集で開き直せます。',
    variant: 'warning',
    icon: CalendarClock,
  },
  [LobbyStatus.disbanded]: {
    label: '解散',
    text: 'この企画は解散しました。',
    variant: 'error',
    icon: Ban,
  },
};

/**
 * ステータス表示カードの見た目（ラベル・説明文・バリアント・アイコン）を導出する。
 * コンポーネントの責務はテンプレートの構造制御に限るため、対応表はここに置く。
 */
export const useLobbyStatusAppearance = (
  status: MaybeRefOrGetter<LobbyStatus>,
) => ({
  appearance: computed<StatusAppearance>(
    () => STATUS_APPEARANCE[toValue(status)],
  ),
});
