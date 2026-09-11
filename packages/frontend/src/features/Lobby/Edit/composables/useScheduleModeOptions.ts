import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import {
  SCHEDULE_MODE_OPTIONS,
  type ScheduleMode,
} from '@/features/Lobby/Edit/composables/schedule-mode';

/** 切り替えの1枚ぶん。選択中かどうかまで解決済みで渡す */
export type ScheduleModeOption = {
  value: ScheduleMode;
  label: string;
  description: string;
  isSelected: boolean;
};

/**
 * 日程の決め方の選択肢を、選択状態つきで返す。
 *
 * どれが選ばれているかの導出はデータの加工なので、コンポーネントではなく
 * ここに置く（CLAUDE.md「コンポーネントが持っていいもの・composable に寄せるもの」）。
 *
 * @param selected いま選ばれているモード。書き込みはしないので getter で受ける
 */
export const useScheduleModeOptions = (
  selected: MaybeRefOrGetter<ScheduleMode>,
) => {
  const options = computed<ScheduleModeOption[]>(() =>
    SCHEDULE_MODE_OPTIONS.map((option) => ({
      ...option,
      isSelected: option.value === toValue(selected),
    })),
  );

  return { options };
};
