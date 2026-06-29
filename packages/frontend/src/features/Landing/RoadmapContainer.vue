<script setup lang="ts">
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { Lightbulb, BookMarked, Drama } from '@lucide/vue';
</script>

<template>
  <div>
    <h2>できるようになること</h2>
    <div class="card-container">
      <BaseCard>
        <template #header>
          <BaseSectionHeading :icon="BookMarked" level="h3"
            >シナリオ管理</BaseSectionHeading
          >
        </template>

        <p>
          マダミスやTRPGのシナリオを登録して、卓に紐づけて管理できるようにします。
        </p>
      </BaseCard>
      <BaseCard>
        <template #header>
          <BaseSectionHeading :icon="Drama" level="h3"
            >キャラクター管理</BaseSectionHeading
          >
        </template>

        <p>
          TRPGやマダミスのキャラクターを登録し、卓ごとに選択できるようにします。
        </p>
      </BaseCard>

      <BaseCard>
        <template #header>
          <BaseSectionHeading :icon="Lightbulb" level="h3"
            >その他いろいろ？</BaseSectionHeading
          >
        </template>

        <p>
          「こんな機能がほしい！」のリクエストはいつでもお待ちしております。
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
