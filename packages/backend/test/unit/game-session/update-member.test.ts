import { describe, expect, it, vi } from 'vitest';
import { updateMember } from '@/game-session/application/update-member';
import type { UpdateMemberRepository } from '@/game-session/application/update-member';
import type { GameSessionMember } from '@taku-biyori/shared';

const mockMember: GameSessionMember = {
  id: 'member-1',
  userId: 'user-2',
  userName: 'ユーザー',
  guestName: null,
  characterName: '探偵',
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<UpdateMemberRepository> = {},
): UpdateMemberRepository => ({
  findMemberOwner: vi
    .fn()
    .mockResolvedValue({ gameSessionId: 'session-1', userId: 'user-2' }),
  findHostUserId: vi.fn().mockResolvedValue('user-1'),
  updateMemberById: vi.fn().mockResolvedValue(mockMember),
  ...overrides,
});

describe('updateMember', () => {
  it('本人がキャラクター名を更新できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateMember(repo, 'session-1', 'member-1', 'user-2', {
      characterName: '探偵',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('ホストが他のメンバーのキャラクター名を更新できる', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateMember(repo, 'session-1', 'member-1', 'user-1', {
      characterName: '探偵',
    });

    // Assert
    expect(result).toEqual({ type: 'ok', member: mockMember });
  });

  it('存在しないメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({ findMemberOwner: vi.fn().mockResolvedValue(null) });

    // Act
    const result = await updateMember(
      repo,
      'session-1',
      'nonexistent',
      'user-2',
      {},
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('他セッションのメンバーIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMemberOwner: vi
        .fn()
        .mockResolvedValue({
          gameSessionId: 'other-session',
          userId: 'user-2',
        }),
    });

    // Act
    const result = await updateMember(
      repo,
      'session-1',
      'member-1',
      'user-2',
      {},
    );

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('本人でもホストでもないユーザーは forbidden を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await updateMember(repo, 'session-1', 'member-1', 'user-3', {
      characterName: '探偵',
    });

    // Assert
    expect(result).toEqual({ type: 'forbidden' });
  });
});
