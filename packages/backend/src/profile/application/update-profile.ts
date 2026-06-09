import type { ProfileResponse, UpdateProfileInput } from '@taku-biyori/shared';

export interface UpdateProfileRepository {
  updateById(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse | null>;
}

export type UpdateProfileResult =
  | { type: 'ok'; profile: ProfileResponse }
  | { type: 'notFound' };

export const updateProfile = async (
  repo: UpdateProfileRepository,
  userId: string,
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> => {
  const profile = await repo.updateById(userId, input);
  if (!profile) return { type: 'notFound' };
  return { type: 'ok', profile };
};
