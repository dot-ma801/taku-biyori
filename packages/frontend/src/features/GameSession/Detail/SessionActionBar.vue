<script setup lang="ts">
defineOptions({ name: 'SessionActionBar' });
import {
  UserRoundPlus,
  UserRoundMinus,
  SquarePen,
  Globe,
  Trophy,
  Share2,
  Trash,
} from '@lucide/vue';
import BaseButton from '@/components/button/BaseButton.vue';

defineProps<{
  canDelete: boolean;
  isHost: boolean;
  canIssueGuestLink: boolean;
  loadingGuestLink: boolean;
  canPublish: boolean;
  canComplete: boolean;
  loadingStatus: boolean;
  canJoinAny: boolean;
  canLeave: boolean;
  loadingMember: boolean;
}>();

const emit = defineEmits<{
  clickDelete: [];
  clickEdit: [];
  copyGuestLink: [];
  publish: [];
  complete: [];
  join: [];
  leave: [];
}>();
</script>

<template>
  <div class="button-area">
    <BaseButton
      v-if="canDelete"
      :left-icon="Trash"
      variant="danger"
      @click="emit('clickDelete')"
    >
      削除
    </BaseButton>
    <BaseButton
      v-if="isHost"
      :left-icon="SquarePen"
      variant="secondary"
      @click="emit('clickEdit')"
    >
      セッション編集
    </BaseButton>
    <BaseButton
      v-if="canIssueGuestLink"
      :left-icon="Share2"
      variant="secondary"
      :loading="loadingGuestLink"
      @click="emit('copyGuestLink')"
    >
      招待リンクを取得
    </BaseButton>
    <BaseButton
      v-if="canPublish"
      :left-icon="Globe"
      :loading="loadingStatus"
      @click="emit('publish')"
    >
      公開
    </BaseButton>
    <BaseButton
      v-if="canComplete"
      :left-icon="Trophy"
      :loading="loadingStatus"
      @click="emit('complete')"
    >
      セッション完了！
    </BaseButton>
    <BaseButton
      v-if="canJoinAny"
      :left-icon="UserRoundPlus"
      :loading="loadingMember"
      @click="emit('join')"
    >
      参加する
    </BaseButton>
    <BaseButton
      v-if="canLeave"
      :left-icon="UserRoundMinus"
      variant="secondary"
      :loading="loadingMember"
      @click="emit('leave')"
    >
      退出する
    </BaseButton>
  </div>
</template>

<style scoped>
.button-area {
  > * {
    margin: 0 var(--space-1);
  }
}
</style>
