import { describe, expect, it, vi } from 'vitest';
import { updateProfile } from '@/profile/application/update-profile';
import type { UpdateProfileRepository } from '@/profile/application/update-profile';
import type { ProfileResponse } from '@taku-biyori/shared';

const updatedProfile: ProfileResponse = {
  id: 'user-1',
  name: '新しい名前',
  email: 'test@example.com',
  image: null,
};

describe('updateProfile', () => {
  it('name を更新して更新後のプロフィールを返す', async () => {
    // Arrange
    const repo: UpdateProfileRepository = {
      updateById: vi.fn().mockResolvedValue(updatedProfile),
    };

    // Act
    const result = await updateProfile(repo, 'user-1', { name: '新しい名前' });

    // Assert
    expect(result).toEqual({ type: 'ok', profile: updatedProfile });
  });

  it('ユーザーが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo: UpdateProfileRepository = {
      updateById: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await updateProfile(repo, 'nonexistent', {
      name: '新しい名前',
    });

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('updateById に userId と入力を渡す', async () => {
    // Arrange
    const updateById = vi.fn().mockResolvedValue(updatedProfile);
    const repo: UpdateProfileRepository = { updateById };

    // Act
    await updateProfile(repo, 'user-1', { name: '更新後' });

    // Assert
    expect(updateById).toHaveBeenCalledWith('user-1', { name: '更新後' });
  });
});
