import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useLobbyEntriesForSeating } from '@/features/GameSession/Detail/useLobbyEntriesForSeating';

vi.mock('@/api/lobby', () => ({ getLobby: vi.fn() }));
vi.mock('@/stores/auth', () => ({ useAuthStore: vi.fn() }));

import { getLobby } from '@/api/lobby';
import { useAuthStore } from '@/stores/auth';

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('useLobbyEntriesForSeating', () => {
  it('認証復元後にホストと判明したら着席候補を取得する', async () => {
    // Arrange
    const currentUser = ref<{ id: string } | null>(null);
    vi.mocked(useAuthStore).mockReturnValue({
      get currentUser() {
        return currentUser.value;
      },
    } as unknown as ReturnType<typeof useAuthStore>);
    vi.mocked(getLobby).mockResolvedValue({
      activeEntries: [{ id: 'entry-1' }],
    } as never);
    const hostUserId = ref('host-1');
    const { activeEntries } = useLobbyEntriesForSeating('lobby-1', hostUserId);

    // Act
    currentUser.value = { id: 'host-1' };
    await nextTick();

    // Assert
    await vi.waitFor(() => {
      expect(getLobby).toHaveBeenCalledWith('lobby-1');
      expect(activeEntries.value).toEqual([{ id: 'entry-1' }]);
    });
  });
});
