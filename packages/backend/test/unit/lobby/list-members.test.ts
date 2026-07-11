import { describe, expect, it, vi } from 'vitest';
import { listMembers } from '@/lobby/application/list-members';
import type { ListMembersRepository } from '@/lobby/application/list-members';
import type { LobbyMember } from '@taku-biyori/shared';

const mockMember: LobbyMember = {
  id: 'member-1',
  userId: 'user-1',
  userName: 'テストユーザー',
  guestName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<ListMembersRepository> = {},
): ListMembersRepository => ({
  findLobbyVisibility: vi
    .fn()
    .mockResolvedValue({ isPublished: true, hostUserId: 'user-1' }),
  findMembersByLobbyId: vi.fn().mockResolvedValue([mockMember]),
  ...overrides,
});

describe('listMembers', () => {
  it('公開済み募集枠は未認証でもメンバー一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listMembers(repo, 'lobby-1', null);

    // Assert
    expect(result).toEqual({ type: 'ok', members: [mockMember] });
  });

  it('存在しない募集枠IDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi.fn().mockResolvedValue(null),
    });

    // Act
    const result = await listMembers(repo, 'nonexistent', null);

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('メンバーがいない場合は空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMembersByLobbyId: vi.fn().mockResolvedValue([]),
    });

    // Act
    const result = await listMembers(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', members: [] });
  });

  it('非公開募集枠にホストがアクセスするとメンバー一覧を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ isPublished: false, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listMembers(repo, 'lobby-1', 'user-1');

    // Assert
    expect(result).toEqual({ type: 'ok', members: [mockMember] });
  });

  it('非公開募集枠にホスト以外がアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ isPublished: false, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listMembers(repo, 'lobby-1', 'other-user');

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });

  it('非公開募集枠に未認証でアクセスすると forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findLobbyVisibility: vi
        .fn()
        .mockResolvedValue({ isPublished: false, hostUserId: 'user-1' }),
    });

    // Act
    const result = await listMembers(repo, 'lobby-1', null);

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
