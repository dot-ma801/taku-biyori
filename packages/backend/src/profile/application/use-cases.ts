import type { UpdateProfileInput } from '@taku-biyori/shared';
import type {
  GetProfileRepository,
  GetProfileResult,
} from '@/profile/application/get-profile';
import type {
  UpdateProfileRepository,
  UpdateProfileResult,
} from '@/profile/application/update-profile';
import { getProfile } from '@/profile/application/get-profile';
import { updateProfile } from '@/profile/application/update-profile';

type ProfileRepo = GetProfileRepository & UpdateProfileRepository;

export const createProfileUseCases = (repo: ProfileRepo) => ({
  getProfile: (userId: string): Promise<GetProfileResult> =>
    getProfile(repo, userId),
  updateProfile: (
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UpdateProfileResult> => updateProfile(repo, userId, input),
});

export type ProfileUseCases = ReturnType<typeof createProfileUseCases>;
