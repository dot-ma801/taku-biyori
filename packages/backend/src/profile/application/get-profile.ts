import type { ProfileResponse } from '@taku-biyori/shared';

export interface GetProfileRepository {
  findById(userId: string): Promise<ProfileResponse | null>;
}

export type GetProfileResult =
  | { type: 'ok'; profile: ProfileResponse }
  | { type: 'notFound' };

export const getProfile = async (
  repo: GetProfileRepository,
  userId: string,
): Promise<GetProfileResult> => {
  const profile = await repo.findById(userId);
  if (!profile) return { type: 'notFound' };
  return { type: 'ok', profile };
};
