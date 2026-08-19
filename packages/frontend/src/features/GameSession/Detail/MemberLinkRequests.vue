<script setup lang="ts">
import BaseButton from '@/components/button/BaseButton.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { useMemberLinkApproval } from '@/features/GameSession/Detail/useMemberLinkApproval';
import type { GameSessionDetail, GameSessionMember } from '@taku-biyori/shared';
import { UserRoundCheck, UserRoundX, Link2 } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps<{
  gameSession: GameSessionDetail;
  isHost: boolean;
}>();

const emit = defineEmits<{
  'member-linked': [member: GameSessionMember];
}>();

const { requests, hasRequests, loading, approve, reject } =
  useMemberLinkApproval(
    props.gameSession.id,
    () => props.isHost,
    (member) => emit('member-linked', member),
  );

/** 「ゲスト太郎 → たろう」の形で、誰がどのゲストとして名乗り出ているかを示す */
const displayRequests = computed(() =>
  requests.value.map((request) => ({
    id: request.id,
    guestName: request.memberGuestName ?? '名前未設定のゲスト',
    userName: request.requestedUserName ?? 'アカウント名未設定',
  })),
);
</script>

<template>
  <section v-if="isHost && hasRequests" class="link-requests">
    <BaseSectionHeading level="h2" :icon="Link2">
      ゲスト参加の紐づけ申請
    </BaseSectionHeading>

    <p class="note">
      ゲストとして参加した人から、アカウントへの紐づけ申請が届いています。本人だと確認できる場合のみ承認してください。
    </p>

    <BaseCard v-for="request in displayRequests" :key="request.id">
      <div class="request">
        <p class="request__names">
          <span class="request__guest">{{ request.guestName }}</span>
          <span class="request__arrow">→</span>
          <span class="request__user">{{ request.userName }}</span>
        </p>

        <div class="request__actions">
          <BaseButton
            :loading="loading"
            :left-icon="UserRoundCheck"
            @click="approve(request.id)"
          >
            承認
          </BaseButton>
          <BaseButton
            :loading="loading"
            variant="secondary"
            :left-icon="UserRoundX"
            @click="reject(request.id)"
          >
            却下
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </section>
</template>

<style scoped>
.link-requests {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.note {
  color: var(--color-text-muted, inherit);
  font-size: var(--font-size-sm, 0.875rem);
}

.request {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.request__names {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  /* 長い名前でも折り返して崩れないようにする */
  min-width: 0;
  overflow-wrap: anywhere;
}

.request__actions {
  display: flex;
  gap: var(--space-2);
}
</style>
