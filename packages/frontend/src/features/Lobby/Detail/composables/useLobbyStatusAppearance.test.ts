import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { useLobbyStatusAppearance } from '@/features/Lobby/Detail/composables/useLobbyStatusAppearance';

describe('useLobbyStatusAppearance', () => {
  it.each([
    [LobbyStatus.draft, '下書き', 'default'],
    [LobbyStatus.open, '受付中', 'primary'],
    [LobbyStatus.closed, '受付終了', 'warning'],
    [LobbyStatus.disbanded, '解散', 'error'],
  ] as const)(
    'status=%s のとき label=%s / variant=%s を返す',
    (status, expectedLabel, expectedVariant) => {
      // Arrange / Act
      const { appearance } = useLobbyStatusAppearance(() => status);

      // Assert
      expect(appearance.value.label).toBe(expectedLabel);
      expect(appearance.value.variant).toBe(expectedVariant);
    },
  );

  it('4ステータスすべてに説明文とアイコンがある', () => {
    // Arrange / Act / Assert
    for (const status of Object.values(LobbyStatus)) {
      const { appearance } = useLobbyStatusAppearance(() => status);
      expect(appearance.value.text).not.toBe('');
      expect(appearance.value.icon).toBeDefined();
    }
  });

  it('status の変化に追従する', () => {
    // Arrange
    const status = ref<LobbyStatus>(LobbyStatus.open);
    const { appearance } = useLobbyStatusAppearance(() => status.value);

    // Act
    status.value = LobbyStatus.closed;

    // Assert
    expect(appearance.value.label).toBe('受付終了');
  });
});
