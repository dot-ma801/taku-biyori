import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { LobbyStatus } from '@taku-biyori/shared';
import { useLobbyStatusBadge } from '@/components/common/LobbyStatusBadge/useLobbyStatusBadge';

describe('useLobbyStatusBadge', () => {
  it.each([
    [LobbyStatus.draft, '非公開', 'muted'],
    [LobbyStatus.open, '募集中', 'primary'],
    [LobbyStatus.closed, '受付終了', 'warning'],
    [LobbyStatus.disbanded, '解散', 'error'],
  ] as const)(
    'status=%s のとき label=%s / variant=%s を返す',
    (status, expectedLabel, expectedVariant) => {
      // Arrange / Act
      const { label, variant } = useLobbyStatusBadge(() => status);

      // Assert
      expect(label.value).toBe(expectedLabel);
      expect(variant.value).toBe(expectedVariant);
    },
  );

  it('status の変化に追従する', () => {
    // Arrange
    const status = ref<LobbyStatus>(LobbyStatus.open);
    const { label } = useLobbyStatusBadge(() => status.value);

    // Act
    status.value = LobbyStatus.disbanded;

    // Assert
    expect(label.value).toBe('解散');
  });
});
