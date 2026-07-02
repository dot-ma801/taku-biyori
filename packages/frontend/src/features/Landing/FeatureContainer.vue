<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { Megaphone, UserRound, CalendarCheck } from '@lucide/vue';
</script>

<template>
  <div>
    <h2>できること</h2>
    <div class="card-container">
      <BaseCard>
        <template #header>
          <BaseSectionHeading :icon="Megaphone" level="h3"
            >メンバー募集</BaseSectionHeading
          >
        </template>

        <p>
          セッションを作成して公開すれば、仲間に参加してもらえます。<br />共有リンクならログイン不要！
        </p>
      </BaseCard>
      <BaseCard>
        <template #header>
          <BaseSectionHeading :icon="CalendarCheck" level="h3"
            >日程調整</BaseSectionHeading
          >
        </template>

        <p>◯△✕で答えて、全員参加可能な日を一覧できます。</p>
      </BaseCard>

      <BaseCard>
        <template #header>
          <BaseSectionHeading :icon="UserRound" level="h3"
            >ゲスト参加</BaseSectionHeading
          >
        </template>

        <p>
          参加者は共有されたURLを踏むだけ。<br />
          アカウント登録なしでも日程回答や卓への参加ができます。
        </p>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
h2 {
  text-align: center;
}

.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));

  gap: var(--space-4);
}
</style>
