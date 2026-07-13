<script setup lang="ts">
import UserAvatar from '@/features/user/UserAvatar/UserAvatar.vue';
import BaseButton from '@/components/button/BaseButton.vue';
import BaseTextBox from '@/components/form/BaseTextBox/BaseTextBox.vue';
import BaseCard from '@/components/common/BaseCard/BaseCard.vue';
import BaseSectionHeading from '@/components/common/BaseSectionHeading/BaseSectionHeading.vue';
import { UsersRound, SquarePen, Check } from '@lucide/vue';
import type { LobbyDetail } from '@taku-biyori/shared';
import { memberDisplayName, memberBaseName } from '@/utils/memberDisplayName';
import { computed } from 'vue';
const props = defineProps<{
  lobby: LobbyDetail;
}>();

const displayMembers = computed(() => {
  props.lobby.members.map((member) => ({
    id: member.id,
    userName: memberDisplayName(member),
    // アバターの色を変えないため、サフィックスなしの名前を渡す
    baseName: memberBaseName(member),
  }));
});
</script>

<template>
  <BaseCard>
    <BaseSectionHeading class="header" level="h3" :icon="UsersRound">
      参加メンバー
    </BaseSectionHeading>

    <div
      v-for="member in displayMembers"
      :key="member.id"
      class="user-container"
    >
      <UserAvatar
        class="avatar"
        :size="35"
        :name="member.baseName"
      ></UserAvatar>

      <p>
        <span v-if="member.characterName">
          {{ member.characterName }}
          <span class="user-name">@ </span>
        </span>
        <span class="user-name">{{ member.userName }}</span>
      </p>
    </div>
  </BaseCard>
</template>

<style scoped>
.header {
  margin-bottom: var(--space-4);
}

.user-container {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;

  gap: var(--space-2);
  padding: var(--space-2);

  border-top: solid 2px var(--color-border);
}

.edit-char-name {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-2);
}

.user-name {
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-3);

  > * {
    margin: 0 var(--space-1);
  }
}
</style>
