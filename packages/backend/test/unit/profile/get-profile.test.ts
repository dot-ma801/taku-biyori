import { describe, expect, it, vi } from 'vitest';
import { getProfile } from '@/profile/application/get-profile';
import type { GetProfileRepository } from '@/profile/application/get-profile';
import type { ProfileResponse } from '@taku-biyori/shared';

const mockProfile: ProfileResponse = {
  id: 'user-1',
  name: 'テストユーザー',
  email: 'test@example.com',
  image: null,
};

describe('getProfile', () => {
  it('存在するユーザーのプロフィールを返す', async () => {
    // Arrange
    const repo: GetProfileRepository = {
      findById: vi.fn().mockResolvedValue(mockProfile),
    };

    // Act
    const result = await getProfile(repo, 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', profile: mockProfile });
  });

  it('ユーザーが存在しない場合は notFound を返す', async () => {
    // Arrange
    const repo: GetProfileRepository = {
      findById: vi.fn().mockResolvedValue(null),
    };

    // Act
    const result = await getProfile(repo, 'nonexistent');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('findById に userId を渡す', async () => {
    // Arrange
    const findById = vi.fn().mockResolvedValue(mockProfile);
    const repo: GetProfileRepository = { findById };

    // Act
    await getProfile(repo, 'user-abc');

    // Assert
    expect(findById).toHaveBeenCalledWith('user-abc');
  });
});
