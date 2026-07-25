import type { ProfileResponse, UpdateProfileInput } from '@taku-biyori/shared';
import { apiRequest } from '@/lib/api-client';

export async function getProfile(): Promise<ProfileResponse> {
  return (await apiRequest<ProfileResponse>('/api/profile'))!;
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<ProfileResponse> {
  return (await apiRequest<ProfileResponse>('/api/profile', {
    method: 'PATCH',
    body: input,
  }))!;
}
