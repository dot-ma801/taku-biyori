import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  bulkUpdateLobbyAvailabilityDates,
  getLobby,
  listLobbyAvailabilityDates,
  updateLobby,
} from '@/api/lobby';
import { ApiError } from '@/lib/api-client';
import {
  getMaxMembersError,
  parseMaxMembers,
} from '@/features/Lobby/Edit/composables/maxMembersValidation';

export const useUpdateLobby = (id: string) => {
  const router = useRouter();

  const title = ref('');
  const scenarioName = ref('');
  const maxMembers = ref('');
  const description = ref('');
  const openUntil = ref('');
  const location = ref('');
  const pendingDates = ref<string[]>([]);
  const loading = ref(false);
  const errorMessage = ref('');

  /** Loads the lobby values to initialize the edit form. */
  async function fetchInitialValues() {
    loading.value = true;
    errorMessage.value = '';

    try {
      const [lobby, availabilityDates] = await Promise.all([
        getLobby(id),
        listLobbyAvailabilityDates(id),
      ]);
      title.value = lobby.title;
      scenarioName.value = lobby.scenarioName ?? '';
      maxMembers.value =
        lobby.maxPlayers !== null && lobby.maxPlayers !== undefined
          ? String(lobby.maxPlayers)
          : '';
      description.value = lobby.description ?? '';
      openUntil.value = lobby.openUntil ?? '';
      location.value = lobby.location ?? '';
      pendingDates.value = availabilityDates.map((date) => date.date);
    } catch (err) {
      errorMessage.value =
        err instanceof ApiError ? err.message : 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchInitialValues);

  /** Validates and saves the lobby, then navigates to its detail page. */
  async function submit() {
    errorMessage.value = '';

    const maxMembersError = getMaxMembersError(maxMembers.value);
    if (maxMembersError) {
      errorMessage.value = maxMembersError;
      return;
    }

    loading.value = true;
    try {
      const parsedMaxMembers = parseMaxMembers(maxMembers.value);
      await updateLobby(id, {
        ...(title.value.trim() ? { title: title.value } : {}),
        scenarioName: scenarioName.value || null,
        maxPlayers: parsedMaxMembers,
        description: description.value || null,
        openUntil: openUntil.value || null,
        location: location.value || null,
      });
      await bulkUpdateLobbyAvailabilityDates(id, { dates: pendingDates.value });

      await router.push({
        name: 'lobbies-detail',
        params: { lobbyId: id },
      });
    } catch (err) {
      errorMessage.value =
        err instanceof ApiError ? err.message : 'エラーが発生しました';
    } finally {
      loading.value = false;
    }
  }

  function cancel() {
    router.back();
  }

  return {
    title,
    scenarioName,
    maxMembers,
    description,
    openUntil,
    location,
    pendingDates,
    loading,
    errorMessage,
    fetchInitialValues,
    submit,
    cancel,
  };
};
