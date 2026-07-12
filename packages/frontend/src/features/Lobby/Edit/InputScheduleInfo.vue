<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseChip from '@/components/common/BaseChip/BaseChip.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import BaseDatePicker from '@/components/form/BaseDatePicker/BaseDatePicker.vue';
import { useAvailabilityDates } from '@/features/Lobby/Edit/composables/useAvailabilityDates';
import { CalendarDays } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  /** 更新フローのときのみ渡す。未指定のとき候補日はローカル管理（pendingDates） */
  gameSessionId?: string;
  /** 更新フローで日程が確定済みのとき true。候補日セクションを非表示にする */
  isScheduled?: boolean;
}>();

const openUntil = defineModel<string>('openUntil', { default: '' });
const scheduledAt = defineModel<string>('scheduledAt', { default: '' });
/**
 * 新規作成フロー用の候補日リスト。
 * gameSessionId がない場合にのみ使用し、セッション作成後に呼び出し元が一括 POST する。
 */
const pendingDates = defineModel<string[]>('pendingDates', {
  default: () => [],
});

const selectMultiDays = ref(false);

// 更新フロー: API と同期する composable
const availability = props.gameSessionId
  ? useAvailabilityDates(props.gameSessionId)
  : null;

// 候補日は onMounted で非同期取得されるため、取得完了時に一度だけ
// 「候補日が既にあるなら複数日選択モードを自動でONにする」を反映する。
// 以降はホストが自由にトグルできるよう、この watch は初回のみ発火する。
if (availability) {
  watch(
    () => availability.availabilityDates.value.length,
    (length) => {
      if (length > 0) selectMultiDays.value = true;
    },
    { once: true },
  );
}

// 複数日 picker 用の writable computed
// get: API 管理 or ローカル管理の日付リストを返す
// set: 更新フローは差分を API に送信、新規作成フローはローカルに保持
//
// 候補日への入力（ユーザー操作起点の set のみ）で開催日を破棄する。
// マウント時の候補日非同期 fetch は get 側で反映されるだけで set を通らないため、
// 確定済み scheduledAt を誤って消さない。
const selectedDates = computed<string[]>({
  get() {
    if (availability) {
      return availability.availabilityDates.value.map((d) => d.date);
    }
    return pendingDates.value;
  },
  set(dates) {
    if (availability) {
      availability.syncDates(dates);
    } else {
      pendingDates.value = dates;
    }
    if (dates.length > 0) {
      scheduledAt.value = '';
    }
  },
});

function removeDate(date: string) {
  selectedDates.value = selectedDates.value.filter((d) => d !== date);
}
</script>

<template>
  <BaseCard>
    <template #header>
      <BaseSectionHeading level="h2" :icon="CalendarDays" text-color="default">
        実施情報
      </BaseSectionHeading>
    </template>

    <template #default>
      <div class="contents">
        <BaseDatePicker
          v-model="openUntil"
          label="募集締め切り日"
          disable-past
        ></BaseDatePicker>

        <BaseDatePicker
          label="候補日"
          multiple
          disable-past
          v-model="selectedDates"
        ></BaseDatePicker>
      </div>

      <ul v-if="selectedDates.length" class="dates">
        <li v-for="item in selectedDates" :key="item">
          <BaseChip selected removable size="lg" @remove="removeDate(item)">
            {{ item }}
          </BaseChip>
        </li>
      </ul>

      <p v-if="availability?.errorMessage.value" class="error">
        {{ availability.errorMessage.value }}
      </p>
      <p class="info">※ 候補日は募集枠作成後も追加・削除できます。</p>

    </template>
  </BaseCard>
</template>

<style scoped>
.switch {
  margin-bottom: var(--space-4);
}

.contents {
  /* 余白 */
  > * {
    margin: var(--space-5) 0;

    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.error {
  font-size: 13px;
  color: var(--color-error);
}

.info {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.dates {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
  padding: 0;
  list-style: none;
}
</style>
