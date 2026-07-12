import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyDetail } from '@taku-biyori/shared';
import { LobbyStatus } from '@taku-biyori/shared';
import { useUpdateLobby } from '@/features/Lobby/Edit/composables/useUpdateLobby';

vi.mock('@/api/lobby', () => ({
  bulkUpdateLobbyAvailabilityDates: vi.fn(),
  getLobby: vi.fn(),
  listLobbyAvailabilityDates: vi.fn(),
  updateLobby: vi.fn(),
}));

const pushMock = vi.fn();
const backMock = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({ push: pushMock, back: backMock })),
}));

import {
  bulkUpdateLobbyAvailabilityDates,
  getLobby,
  listLobbyAvailabilityDates,
  updateLobby,
} from '@/api/lobby';

const LOBBY_ID = 'lobby-1';
const lobby: LobbyDetail = {
  id: LOBBY_ID,
  title: 'Test lobby',
  scenarioName: 'Scenario',
  description: 'Description',
  location: 'Tokyo',
  maxPlayers: 4,
  status: LobbyStatus.draft,
  isPublished: false,
  openUntil: '2026-07-20',
  closedAt: null,
  cancelledAt: null,
  hostUserId: 'user-1',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  members: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLobby).mockResolvedValue(lobby);
  vi.mocked(listLobbyAvailabilityDates).mockResolvedValue([
    { id: 'date-1', date: '2026-07-25', answers: [] },
  ]);
  vi.mocked(updateLobby).mockResolvedValue(lobby);
  vi.mocked(bulkUpdateLobbyAvailabilityDates).mockResolvedValue([]);
});

describe('useUpdateLobby', () => {
  it('fetches the lobby and initializes the form values', async () => {
    const { fetchInitialValues, title, scenarioName, maxMembers, description, openUntil, location, pendingDates } = useUpdateLobby(LOBBY_ID);

    await fetchInitialValues();

    expect(getLobby).toHaveBeenCalledWith(LOBBY_ID);
    expect(title.value).toBe('Test lobby');
    expect(scenarioName.value).toBe('Scenario');
    expect(maxMembers.value).toBe('4');
    expect(description.value).toBe('Description');
    expect(openUntil.value).toBe('2026-07-20');
    expect(location.value).toBe('Tokyo');
    expect(pendingDates.value).toEqual(['2026-07-25']);
  });

  it('does not update when max members is outside the allowed range', async () => {
    const { maxMembers, errorMessage, submit } = useUpdateLobby(LOBBY_ID);
    maxMembers.value = '21';

    await submit();

    expect(updateLobby).not.toHaveBeenCalled();
    expect(errorMessage.value).not.toBe('');
  });

  it('updates the lobby and returns to its detail page', async () => {
    const { title, scenarioName, maxMembers, description, openUntil, location, pendingDates, submit } = useUpdateLobby(LOBBY_ID);
    title.value = 'Updated lobby';
    scenarioName.value = '';
    maxMembers.value = '';
    description.value = '';
    openUntil.value = '';
    location.value = '';
    pendingDates.value = ['2026-07-25'];

    await submit();

    expect(updateLobby).toHaveBeenCalledWith(LOBBY_ID, {
      title: 'Updated lobby',
      scenarioName: null,
      maxPlayers: null,
      description: null,
      openUntil: null,
      location: null,
    });
    expect(bulkUpdateLobbyAvailabilityDates).toHaveBeenCalledWith(LOBBY_ID, {
      dates: ['2026-07-25'],
    });
    expect(pushMock).toHaveBeenCalledWith({
      name: 'lobbies-detail',
      params: { lobbyId: LOBBY_ID },
    });
  });

  it('returns to the previous page when cancelled', () => {
    const { cancel } = useUpdateLobby(LOBBY_ID);

    cancel();

    expect(backMock).toHaveBeenCalled();
  });
});
