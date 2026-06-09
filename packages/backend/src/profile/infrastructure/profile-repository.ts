import { eq } from 'drizzle-orm';
import type { ProfileResponse, UpdateProfileInput } from '@taku-biyori/shared';
import type { Database } from '@/system/infrastructure/database/client';
import { user } from '@/system/infrastructure/database/schema';
import type { GetProfileRepository } from '@/profile/application/get-profile';
import type { UpdateProfileRepository } from '@/profile/application/update-profile';

export interface ProfileRepository
  extends GetProfileRepository, UpdateProfileRepository {}

const toProfileResponse = (row: {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}): ProfileResponse => ({
  id: row.id,
  name: row.name,
  email: row.email!,
  image: row.image,
});

export const createProfileRepository = (db: Database): ProfileRepository => ({
  async findById(userId) {
    const rows = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (rows.length === 0) return null;
    return toProfileResponse(rows[0]);
  },

  async updateById(userId, input: UpdateProfileInput) {
    const rows = await db
      .update(user)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      });

    if (rows.length === 0) return null;
    return toProfileResponse(rows[0]);
  },
});
