import { describe, expect, it, vi } from 'vitest';
import { listMembers } from '@/game-session/application/list-members';
import type { ListMembersRepository } from '@/game-session/application/list-members';
import type { GameSessionMember } from '@taku-biyori/shared';

const mockMember: GameSessionMember = {
  id: 'member-1',
  userId: 'user-1',
  userName: 'テストユーザー',
  guestName: null,
  characterName: null,
  joinedAt: '2025-01-01T00:00:00.000Z',
};

const makeRepo = (
  overrides: Partial<ListMembersRepository> = {},
): ListMembersRepository => ({
  gameSessionExists: vi.fn().mockResolvedValue(true),
  findMembersByGameSessionId: vi.fn().mockResolvedValue([mockMember]),
  ...overrides,
});

describe('listMembers', () => {
  it('セッションのメンバー一覧を返す', async () => {
    // Arrange
    const repo = makeRepo();

    // Act
    const result = await listMembers(repo, 'session-1');

    // Assert
    expect(result).toEqual({ type: 'ok', members: [mockMember] });
  });

  it('存在しないセッションIDは notFound を返す', async () => {
    // Arrange
    const repo = makeRepo({
      gameSessionExists: vi.fn().mockResolvedValue(false),
    });

    // Act
    const result = await listMembers(repo, 'nonexistent');

    // Assert
    expect(result).toEqual({ type: 'notFound' });
  });

  it('メンバーがいない場合は空配列を返す', async () => {
    // Arrange
    const repo = makeRepo({
      findMembersByGameSessionId: vi.fn().mockResolvedValue([]),
    });

    // Act
    const result = await listMembers(repo, 'session-1');

    // Assert
    expect(result).toEqual({ type: 'ok', members: [] });
  });
});
